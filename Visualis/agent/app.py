"""
Agent service: Langchain-based HTML generator.
Exposes POST /generate and POST /feedback for the main server.
"""
from __future__ import annotations

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


class FeedbackBody(BaseModel):
    runId: str
    feedback: str


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
        )
        return {"htmlSnippet": raw_snippet, "librariesUsed": libraries_used}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@app.post("/feedback")
async def feedback(body: FeedbackBody) -> dict[str, Any]:
    """Apply feedback; load run from Redis, generate new snippet, save and return."""
    try:
        raw_snippet, libraries_used = run_feedback(run_id=body.runId, feedback=body.feedback)
        return {"htmlSnippet": raw_snippet, "librariesUsed": libraries_used}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
