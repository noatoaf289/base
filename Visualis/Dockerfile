# Visualis — single image: server + agent + built SPA.
# Stage 1: build the client assets.
FROM node:22-alpine AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# Stage 2: runtime image (server + agent + built client).
FROM python:3.12-slim

WORKDIR /app

# Libs and app code
COPY libs /app/libs
COPY server /app/server
COPY agent /app/agent
COPY mocks /app/mocks
COPY scripts /app/scripts
COPY --from=client-build /app/client/dist /app/static

RUN pip install --no-cache-dir -r server/requirements.txt \
    && pip install --no-cache-dir -r agent/requirements.txt

ENV PYTHONPATH=/app
ENV LIBS_ROOT=/app/libs
ENV STATIC_DIR=/app/static
# Default internal agent URL; override at runtime if needed
ENV AGENT_URL=http://127.0.0.1:8002
# Other runtime configuration (not given defaults here, but expected to be provided):
# - FLAPI_URL: flapi base URL
# - REDIS_URL: redis connection string
# - MODEL_URL / MODEL_NAME: LLM base URL and model id
# - MODEL_USER / MODEL_PASSWORD: optional HTTP basic auth for model server
# - S3_URL / S3_ACCESS_KEY / S3_SECRET_KEY: optional S3-compatible storage
# - STATIC_DIR: directory for built SPA assets (served by server)
EXPOSE 8000 8002

# Run agent on 8002 and server on 8000 (server calls agent at AGENT_URL)
CMD ["sh", "-c", "uvicorn agent.app:app --host 0.0.0.0 --port 8002 & sleep 1 && uvicorn server.app:app --host 0.0.0.0 --port 8000"]
