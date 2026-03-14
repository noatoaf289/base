#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="${ROOT_DIR}/.dev-run"
LOG_DIR="${RUN_DIR}/logs"
PID_DIR="${RUN_DIR}/pids"
VENV_DIR="${ROOT_DIR}/.venv"
PYTHON_BIN="${VENV_DIR}/bin/python"
PIP_BIN="${VENV_DIR}/bin/pip"

mkdir -p "${LOG_DIR}" "${PID_DIR}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

ensure_venv_and_python_deps() {
  if [[ ! -x "${PYTHON_BIN}" ]]; then
    python3 -m venv "${VENV_DIR}"
  fi

  "${PIP_BIN}" install --upgrade pip
  "${PIP_BIN}" install -r "${ROOT_DIR}/server/requirements.txt"
  "${PIP_BIN}" install -r "${ROOT_DIR}/agent/requirements.txt"
  "${PIP_BIN}" install -r "${ROOT_DIR}/mocks/requirements.txt"
}

ensure_node_deps() {
  npm --prefix "${ROOT_DIR}/client" ci
  npm --prefix "${ROOT_DIR}/mocks" ci
}

start_compose_services() {
  docker compose \
    -f "${ROOT_DIR}/mocks/docker-compose.yaml" \
    -f "${ROOT_DIR}/mocks/docker-compose.models.yaml" \
    up -d redis-stack mocks minio vllm-gemma
}

write_env_file() {
  cat >"${RUN_DIR}/app.env" <<'EOF'
PYTHONPATH=.
REDIS_URL=redis://localhost:6379/0
MODEL_URL=http://localhost:8010/v1
MODEL_NAME=Qwen/Qwen2.5-Coder-1.5B-Instruct
MODEL_USER=
MODEL_PASSWORD=
PUBLIC_MODEL_URL=http://localhost:8010/v1
PUBLIC_MODEL_USER=
PUBLIC_MODEL_PASSWORD=
OPENAI_API_KEY=mock
HUGGING_FACE_HUB_TOKEN=
S3_URL=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadminpassword
S3_BUCKET=visualis
AWS_REGION=us-east-1
FLAPI_URL=http://localhost:4000
AGENT_URL=http://127.0.0.1:8002
BASE_URL=http://localhost:8000
IFRAME_DATA_EVENT=VISUALIS_IFRAME_DATA
EOF
}

ensure_minio_bucket() {
  set +e
  set -a
  # shellcheck disable=SC1091
  source "${RUN_DIR}/app.env"
  set +a
  "${PYTHON_BIN}" - <<'PY'
import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

endpoint = os.environ.get("S3_URL", "").strip()
access = os.environ.get("S3_ACCESS_KEY", "").strip()
secret = os.environ.get("S3_SECRET_KEY", "").strip()
bucket = os.environ.get("S3_BUCKET", "visualis").strip()
region = os.environ.get("AWS_REGION", "us-east-1").strip()

if not endpoint or not access or not secret:
    raise SystemExit(0)

s3 = boto3.client(
    "s3",
    endpoint_url=endpoint,
    aws_access_key_id=access,
    aws_secret_access_key=secret,
    config=Config(signature_version="s3v4"),
    region_name=region,
)

try:
    s3.head_bucket(Bucket=bucket)
except ClientError:
    s3.create_bucket(Bucket=bucket)
PY
  set -e
}

is_pid_running() {
  local pid="$1"
  kill -0 "${pid}" >/dev/null 2>&1
}

start_managed_process() {
  local name="$1"
  local command="$2"
  local pid_file="${PID_DIR}/${name}.pid"
  local log_file="${LOG_DIR}/${name}.log"

  if [[ -f "${pid_file}" ]]; then
    local existing_pid
    existing_pid="$(<"${pid_file}")"
    if [[ -n "${existing_pid}" ]] && is_pid_running "${existing_pid}"; then
      echo "${name} already running with PID ${existing_pid}"
      return 0
    fi
  fi

  (
    cd "${ROOT_DIR}"
    set -a
    # shellcheck disable=SC1091
    source "${RUN_DIR}/app.env"
    set +a
    nohup bash -lc "${command}" >"${log_file}" 2>&1 &
    echo $! >"${pid_file}"
  )
  echo "Started ${name} (PID $(<"${pid_file}"))"
}

check_http() {
  local name="$1"
  local url="$2"
  if curl --silent --show-error --fail --max-time 10 "${url}" >/dev/null; then
    echo "OK: ${name} (${url})"
    return 0
  fi
  echo "FAIL: ${name} (${url})"
  return 1
}

verify_compose_services() {
  local output
  output="$(
    docker compose \
      -f "${ROOT_DIR}/mocks/docker-compose.yaml" \
      -f "${ROOT_DIR}/mocks/docker-compose.models.yaml" \
      ps
  )"
  echo "${output}"
  for service in redis-stack mocks minio vllm-gemma; do
    if ! echo "${output}" | grep -Eq "${service}"; then
      echo "Compose service missing: ${service}"
      return 1
    fi
    if ! echo "${output}" | grep -Eq "${service}.*(Up|running|healthy)"; then
      echo "Compose service not running as expected: ${service}"
      return 1
    fi
  done
}

main() {
  require_command docker
  require_command npm
  require_command python3
  require_command curl

  echo "Installing local dependencies..."
  ensure_venv_and_python_deps
  ensure_node_deps

  echo "Starting Docker services..."
  start_compose_services

  write_env_file
  ensure_minio_bucket

  echo "Starting local processes..."
  start_managed_process "agent" "${VENV_DIR}/bin/uvicorn agent.app:app --host 0.0.0.0 --port 8002 --reload --app-dir ."
  start_managed_process "server" "${VENV_DIR}/bin/uvicorn server.app:app --host 0.0.0.0 --port 8000 --reload --app-dir ."
  start_managed_process "client" "cd client && npm run dev -- --host 0.0.0.0 --port 5173"

  echo "Waiting 60 seconds for services to settle..."
  sleep 60

  echo "Verifying containers and endpoints..."
  verify_compose_services
  check_http "Redis Stack UI" "http://127.0.0.1:8001"
  check_http "Mock API" "http://127.0.0.1:4000/health"
  check_http "MinIO Console" "http://127.0.0.1:9001"
  check_http "vLLM Qwen models endpoint" "http://127.0.0.1:8010/v1/models"
  check_http "Agent API" "http://127.0.0.1:8002/health"
  check_http "Server API libs" "http://127.0.0.1:8000/api/libs"
  check_http "Client dev server" "http://127.0.0.1:5173"

  echo ""
  echo "All services are up."
  echo "Logs: ${LOG_DIR}"
  echo "Env file: ${RUN_DIR}/app.env"
}

main "$@"
