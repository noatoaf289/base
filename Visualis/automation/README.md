# Automation Tests (Vitest + UI)

This folder contains integration tests that:

1. Call the Visualis server `/api/generate` endpoint directly.
2. Take the returned `htmlSnippet`.
3. Evaluate quality with a local OpenAI-compatible model (LLM as judge).

## Install

```bash
cd automation
npm install
```

## Environment variables

Optional values (defaults shown):

- `SERVER_BASE_URL` (default `http://localhost:8000`)
- `JUDGE_BASE_URL` (default `http://localhost:8010/v1`)
- `JUDGE_MODEL` (default `Qwen/Qwen2.5-Coder-1.5B-Instruct`)
- `JUDGE_API_KEY` (optional bearer auth)
- `JUDGE_USER` + `JUDGE_PASSWORD` (optional basic auth)

## Run tests

```bash
npm test
```

## Open Vitest UI

```bash
npm run test:ui
```

## Current test suite

- Bootstrap Tic-Tac-Toe generation quality gate.
- Dashboard generation quality gate (chart + metrics + table).
