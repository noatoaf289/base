#!/usr/bin/env bash
# Run agent in background and server in foreground (for single-container deploy).
set -e
export AGENT_URL="${AGENT_URL:-http://127.0.0.1:8002}"
# Agent listens on 8002
python -m uvicorn agent.app:app --host 0.0.0.0 --port 8002 &
AGENT_PID=$!
sleep 1
# Server proxies to agent at AGENT_URL
python -m uvicorn server.app:app --host 0.0.0.0 --port 8000
kill $AGENT_PID 2>/dev/null || true
