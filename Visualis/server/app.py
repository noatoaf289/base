"""
Main server: SPA, flapi proxy, libs, generate/feedback with lib injection.
All client requests go through this server.
"""
from __future__ import annotations

import os
from pathlib import Path

# Load .env from project root (Visualis folder) so MINIMAX_API_KEY etc. are set
_root = Path(__file__).resolve().parents[1]
_env_file = _root / ".env"
if _env_file.is_file():
    from dotenv import load_dotenv
    load_dotenv(_env_file)
import uuid
from base64 import b64encode
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from server.inject_libs import inject_libs_into_html
from server.libs_discovery import discover_libs
from server.s3_client import get_snippet, put_snippet

app = FastAPI(title="Visualis Server")

AGENT_URL = os.environ.get("AGENT_URL", "http://localhost:8002").rstrip("/")
FLAPI_URL = os.environ.get("FLAPI_URL", "http://localhost:4000").rstrip("/")
STATIC_DIR = os.environ.get("STATIC_DIR", str(Path(__file__).resolve().parents[1] / "static"))
MODEL_URL = os.environ.get("MODEL_URL", "http://localhost:8010/v1").rstrip("/")
MODEL_NAME = os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-Coder-1.5B-Instruct")
PUBLIC_MODEL_URL = os.environ.get("PUBLIC_MODEL_URL", MODEL_URL).rstrip("/")
PUBLIC_MODEL_USER = os.environ.get("PUBLIC_MODEL_USER", "").strip()
PUBLIC_MODEL_PASSWORD = os.environ.get("PUBLIC_MODEL_PASSWORD", "").strip()
LIBS_DESCRIPTORS = discover_libs()


def _error_body(code: str, message: str, details: Any = None) -> dict:
    body: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return body


def _basic_auth_header(user: str, password: str) -> dict[str, str]:
    if not user or not password:
        return {}
    token = b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return {"Authorization": f"Basic {token}"}


def _extract_model_text(response_json: dict[str, Any]) -> str:
    choices = response_json.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first = choices[0]
    if not isinstance(first, dict):
        return ""
    message = first.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content
    text = first.get("text")
    if isinstance(text, str):
        return text
    return ""


BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
IFRAME_DATA_EVENT = os.environ.get("IFRAME_DATA_EVENT", "VISUALIS_IFRAME_DATA").strip()

# Optional MiniMax (OpenAI-compatible)
MINIMAX_BASE_URL = os.environ.get("MINIMAX_BASE_URL", "").rstrip("/")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "").strip()
MINIMAX_MODEL = os.environ.get("MINIMAX_MODEL", "mini-max-01").strip()
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()


def _minimax_available() -> bool:
    """MiniMax is available via OpenRouter (no Group ID) or via native API."""
    if OPENROUTER_API_KEY:
        return True
    return bool(MINIMAX_BASE_URL and MINIMAX_API_KEY)


# --- Config & Models (for client) ---
@app.get("/api/config")
async def get_config() -> dict:
    """Public config: baseUrl for publish links, iframeDataEvent for preview postMessage."""
    return {
        "baseUrl": BASE_URL,
        "iframeDataEvent": IFRAME_DATA_EVENT,
    }


@app.get("/api/models")
async def list_models() -> list[dict]:
    """List available models for generation. When MiniMax is configured, list it first so UI can default to it."""
    default_entry = {"id": "default", "name": "Default (vLLM / env)", "provider": "local"}
    minimax_entry = {"id": "minimax", "name": "MiniMax", "provider": "MiniMax"}
    if _minimax_available():
        return [minimax_entry, default_entry]
    return [default_entry]


# --- Static & SPA ---
static_path = Path(STATIC_DIR)
if static_path.is_dir():
    app.mount("/assets", StaticFiles(directory=str(static_path / "assets")), name="assets")


@app.get("/")
async def index():
    index_file = static_path / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse(content={"message": "SPA not built; serve frontend from STATIC_DIR"})


# --- Flapi proxy ---
@app.get("/api/flapi/packages/search")
async def flapi_search(q: str = "") -> JSONResponse:
    """Proxy to flapi package search; filter to Type === 'Package'."""
    if not q.strip():
        return JSONResponse(
            status_code=422,
            content=_error_body("validation_failed", 'Query parameter "q" is required'),
        )
    url = f"{FLAPI_URL}/package/v1/search/{q.strip()}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url)
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content=_error_body("flapi_unavailable", str(e)),
        )
    if r.status_code >= 400:
        return JSONResponse(
            status_code=502,
            content=_error_body("flapi_unavailable", r.text or str(r.status_code)),
        )
    try:
        raw = r.json()
    except Exception:
        return JSONResponse(
            status_code=502,
            content=_error_body("flapi_unavailable", "Invalid JSON from flapi"),
        )
    if not isinstance(raw, list):
        return JSONResponse(status_code=200, content=[])
    filtered = [x for x in raw if isinstance(x, dict) and x.get("Type") == "Package"]
    return JSONResponse(status_code=200, content=filtered)


@app.post("/api/flapi/packages/{package_id}/run")
async def flapi_run(package_id: str, request: Request) -> JSONResponse:
    url = f"{FLAPI_URL}/package/{package_id}"
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content=_error_body("validation_failed", "Invalid JSON body"))
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=body)
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content=_error_body("flapi_unavailable", str(e)),
        )
    if r.status_code >= 400:
        return JSONResponse(status_code=r.status_code, content=r.json() if r.content else {})
    return JSONResponse(status_code=200, content=r.json())


# --- Libs ---
@app.get("/api/libs")
async def list_libs() -> list[dict]:
    return LIBS_DESCRIPTORS


@app.get("/libs/{path:path}")
async def serve_lib_file(path: str):
    libs_root = Path(os.environ.get("LIBS_ROOT", str(Path(__file__).resolve().parents[1] / "libs")))
    full = (libs_root / path).resolve()
    if not str(full).startswith(str(libs_root.resolve())):
        raise HTTPException(status_code=404, detail="Not found")
    if not full.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(full)


# --- Generate ---
class FieldExplanationModel(BaseModel):
    fieldName: str
    explanation: str


class GenerateBody(BaseModel):
    fieldExplanations: list[FieldExplanationModel] = Field(..., max_length=16)
    userPrompt: str
    mainCubeName: str
    mainCubeData: list[dict[str, Any]]
    modelId: str = Field(default="default", description="Model to use: default | minimax")


@app.post("/api/generate")
async def generate(body: GenerateBody) -> JSONResponse:
    run_id = f"run_{uuid.uuid4().hex}"
    payload = {
        "runId": run_id,
        "fieldExplanations": [e.model_dump() for e in body.fieldExplanations],
        "userPrompt": body.userPrompt,
        "mainCubeName": body.mainCubeName,
        "mainCubeData": body.mainCubeData,
        "modelId": body.modelId,
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(f"{AGENT_URL}/generate", json=payload)
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content=_error_body("agent_unavailable", str(e)),
        )
    if r.status_code == 404:
        return JSONResponse(status_code=404, content=_error_body("run_not_found", "Run not found"))
    if r.status_code >= 400:
        return JSONResponse(
            status_code=502,
            content=_error_body("agent_error", r.text or str(r.status_code)),
        )
    data = r.json()
    raw_snippet = data.get("htmlSnippet", "")
    agent_libs = data.get("librariesUsed") or []
    html_snippet, libraries_used = inject_libs_into_html(
        raw_snippet, LIBS_DESCRIPTORS, agent_libs
    )
    put_snippet(run_id, html_snippet)  # optional: when S3 not configured, snippet still returned for preview
    return JSONResponse(
        content={
            "runId": run_id,
            "htmlSnippet": html_snippet,
            "librariesUsed": libraries_used,
        }
    )


# --- Feedback ---
class FeedbackBody(BaseModel):
    runId: str
    feedback: str
    modelId: str = Field(default="default", description="Model to use: default | minimax")


class PromptRunBody(BaseModel):
    userPrompt: str = Field(..., min_length=1, max_length=20_000)
    systemPrompt: str = Field(default="", max_length=20_000)
    structuredOutputPrompt: str = Field(default="", max_length=20_000)
    restrictionsPrompt: str = Field(default="", max_length=20_000)


@app.post("/api/feedback")
async def feedback(body: FeedbackBody) -> JSONResponse:
    payload = {"runId": body.runId, "feedback": body.feedback, "modelId": body.modelId}
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(f"{AGENT_URL}/feedback", json=payload)
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content=_error_body("agent_unavailable", str(e)),
        )
    if r.status_code == 404:
        return JSONResponse(
            status_code=404,
            content=_error_body("run_not_found", "Run not found or expired"),
        )
    if r.status_code >= 400:
        return JSONResponse(
            status_code=502,
            content=_error_body("agent_error", r.text or str(r.status_code)),
        )
    data = r.json()
    raw_snippet = data.get("htmlSnippet", "")
    agent_libs = data.get("librariesUsed") or []
    html_snippet, libraries_used = inject_libs_into_html(
        raw_snippet, LIBS_DESCRIPTORS, agent_libs
    )
    put_snippet(body.runId, html_snippet)  # optional when S3 not configured
    return JSONResponse(
        content={
            "runId": body.runId,
            "htmlSnippet": html_snippet,
            "librariesUsed": libraries_used,
        }
    )


@app.post("/api/model/prompt")
async def run_public_model_prompt(body: PromptRunBody) -> JSONResponse:
    if not PUBLIC_MODEL_URL:
        return JSONResponse(
            status_code=500,
            content=_error_body("model_misconfigured", "PUBLIC_MODEL_URL is not configured"),
        )

    system_prompt_sections = [
        body.systemPrompt.strip(),
        f"Structured output requirements:\n{body.structuredOutputPrompt.strip()}",
        f"Restrictions:\n{body.restrictionsPrompt.strip()}",
    ]
    system_prompt = "\n\n".join(part for part in system_prompt_sections if part.strip())

    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": body.userPrompt.strip()})

    payload: dict[str, Any] = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
    }
    headers = {
        "Content-Type": "application/json",
        **_basic_auth_header(PUBLIC_MODEL_USER, PUBLIC_MODEL_PASSWORD),
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{PUBLIC_MODEL_URL}/chat/completions",
                json=payload,
                headers=headers,
            )
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content=_error_body("model_unavailable", str(e)),
        )

    if response.status_code >= 400:
        return JSONResponse(
            status_code=502,
            content=_error_body(
                "model_error",
                "Model request failed",
                {"statusCode": response.status_code, "upstreamBody": response.text[:2000]},
            ),
        )

    try:
        response_json = response.json()
    except Exception:
        return JSONResponse(
            status_code=502,
            content=_error_body("model_error", "Invalid JSON from model endpoint"),
        )

    return JSONResponse(
        content={
            "response": _extract_model_text(response_json),
            "modelResponse": response_json,
        }
    )


@app.get("/api/snippets/{run_id}.html")
async def get_snippet_html(run_id: str):
    """Serve persisted HTML snippet for iframe embedding."""
    html = get_snippet(run_id)
    if html is None:
        return JSONResponse(
            status_code=404,
            content=_error_body("run_not_found", f"No snippet found for runId: {run_id}"),
        )
    return HTMLResponse(content=html)


# --- SPA fallback (must be last so /api/* and /libs/* match first) ---
@app.get("/{path:path}")
async def spa_fallback(path: str):
    index_file = static_path / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")
