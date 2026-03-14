"""Redis client for agent: store/load run snippet and summary (12h TTL)."""
from __future__ import annotations

import json
import os
from typing import Any

import redis

TTL_SECONDS = 12 * 60 * 60  # 12h

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


def _client() -> redis.Redis[bytes]:
    return redis.from_url(REDIS_URL, decode_responses=False)


def _key(run_id: str) -> str:
    return f"run:{run_id}"


def save_run(run_id: str, raw_snippet: str, summary: str, libraries_used: list[str]) -> None:
    data = {
        "raw_snippet": raw_snippet,
        "summary": summary,
        "libraries_used": libraries_used,
    }
    r = _client()
    r.setex(_key(run_id), TTL_SECONDS, json.dumps(data))


def load_run(run_id: str) -> dict[str, Any] | None:
    r = _client()
    raw = r.get(_key(run_id))
    if raw is None:
        return None
    return json.loads(raw)


def delete_run(run_id: str) -> bool:
    r = _client()
    return bool(r.delete(_key(run_id)))
