# Visualis — Agent #1 (mock + client) + Agent #2 (server + agent + model mock)
# Python backend: venv, server, agent, model mock. Run mock (port 4000) for client e2e.

.PHONY: venv install install-python install-client build test test-server test-agent test-mocks server agent mock-model mock mock-test client client-build client-e2e client-install client-deps mock-deps lint client-lint format clean

PYTHON ?= python3
VENV ?= .venv
BIN = $(VENV)/bin
MOCK_PORT ?= 4000

# --- Agent #2: Python backend ---
venv:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip

install: install-python install-client

install-python: venv
	$(BIN)/pip install -r server/requirements.txt
	$(BIN)/pip install -r agent/requirements.txt
	$(BIN)/pip install -r mocks/requirements.txt

install-client: client-install

build: client-build

test: test-server test-agent test-mocks

test-server:
	PYTHONPATH=. $(BIN)/pytest server/tests -v

test-agent:
	PYTHONPATH=. SKIP_AGENT_INTEGRATION=1 $(BIN)/pytest agent/tests -v

test-mocks:
	PYTHONPATH=. $(BIN)/pytest mocks/tests -v

server:
	PYTHONPATH=. $(BIN)/uvicorn server.app:app --reload --app-dir .

agent:
	PYTHONPATH=. $(BIN)/uvicorn agent.app:app --reload --app-dir . --port 8002

mock-model:
	PYTHONPATH=. $(BIN)/uvicorn mocks.model_mock.app:app --reload --app-dir . --port 8001

lint:
	$(BIN)/ruff check server agent mocks 2>/dev/null || true
	$(BIN)/ruff format --check server agent mocks 2>/dev/null || true
	$(MAKE) client-lint

format:
	$(BIN)/ruff format server agent mocks 2>/dev/null || true
	$(BIN)/ruff check --fix server agent mocks 2>/dev/null || true

clean:
	rm -rf $(VENV) .pytest_cache **/__pycache__ **/.ruff_cache

# --- Agent #1: Node mock + client ---
mock-deps:
	cd mocks && npm install 2>/dev/null || true

mock: mock-deps
	cd mocks && MOCK_PORT=$(MOCK_PORT) npm start

mock-test: mock-deps
	cd mocks && npm run test

client-deps:
	$(MAKE) client-install

client: client-install
	cd client && npm run dev

client-build: client-install
	cd client && npm run build

client-e2e: client-install
	cd client && npm run test:e2e

client-install:
	cd client && npm ci

client-lint: client-install
	cd client && npm run lint
