"""
Agent service: Langchain-based HTML generator.
Exposes POST /generate and POST /feedback for the main server.
"""
from __future__ import annotations

from pathlib import Path

# Load .env from project root (Visualis folder) so MINIMAX_API_KEY etc. are set
_root = Path(__file__).resolve().parents[1]
_env_file = _root / ".env"
if _env_file.is_file():
    from dotenv import load_dotenv
    load_dotenv(_env_file)

from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from agent.runner import run_feedback, run_generate

app = FastAPI(title="Visualis Agent", description="Langchain HTML snippet generator")


class FieldExplanationModel(BaseModel):
    fieldName: str
    explanation: str


class GenerateBody(BaseModel):
    runId: str
    fieldExplanations: list[FieldExplanationModel] = Field(..., max_length=16)
    userPrompt: str
    mainCubeName: str
    mainCubeData: list[dict[str, Any]]
    modelId: str = "default"


class FeedbackBody(BaseModel):
    runId: str
    feedback: str
    modelId: str = "default"


def _model_connection_hint(model_id: str) -> str:
    if model_id == "default":
        return " For Default model, ensure vLLM is running on MODEL_URL (e.g. port 8010), or select MiniMax and set MINIMAX_API_KEY in Visualis/.env."
    if model_id == "minimax":
        return " Check MINIMAX_API_KEY and MINIMAX_BASE_URL in Visualis/.env and restart the Agent."
    return ""


@app.post("/generate")
async def generate(body: GenerateBody) -> dict[str, Any]:
    """Generate initial HTML snippet; save to Redis; return raw snippet and libs."""
    try:
        raw_snippet, libraries_used = run_generate(
            run_id=body.runId,
            field_explanations=[e.model_dump() for e in body.fieldExplanations],
            user_prompt=body.userPrompt,
            main_cube_name=body.mainCubeName,
            main_cube_data=body.mainCubeData,
            model_id=body.modelId,
        )
        return {"htmlSnippet": raw_snippet, "librariesUsed": libraries_used}
    except Exception as e:
        err = str(e).strip().lower()
        detail = str(e)
        if "connection" in err or "refused" in err or "connect" in err:
            detail = f"Could not connect to model.{_model_connection_hint(body.modelId)} ({e})"
        raise HTTPException(status_code=502, detail=detail) from e


@app.post("/feedback")
async def feedback(body: FeedbackBody) -> dict[str, Any]:
    """Apply feedback; load run from Redis, generate new snippet, save and return."""
    try:
        raw_snippet, libraries_used = run_feedback(
            run_id=body.runId, feedback=body.feedback, model_id=body.modelId
        )
        return {"htmlSnippet": raw_snippet, "librariesUsed": libraries_used}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
