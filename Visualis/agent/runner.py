"""Langchain runner: generate HTML snippet and optionally save to Redis."""
from __future__ import annotations

import os
from base64 import b64encode
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from agent.libs_loader import load_lib_doc, load_system_prompt
from agent.prompt_utils import (
    build_feedback_user_message,
    build_user_message,
    hint_libs_from_prompt,
    parse_llm_response,
    split_into_action_items,
)
from agent.redis_client import load_run, save_run

MODEL_URL = os.environ.get("MODEL_URL", "http://localhost:8010/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "Qwen/Qwen2.5-Coder-1.5B-Instruct")
MAX_SYSTEM_PROMPT_CHARS = int(os.environ.get("MAX_SYSTEM_PROMPT_CHARS", "7000"))
MAX_LIB_DOC_CHARS = int(os.environ.get("MAX_LIB_DOC_CHARS", "1200"))
MAX_LIB_DOCS = int(os.environ.get("MAX_LIB_DOCS", "2"))


def _basic_auth_headers() -> dict[str, str]:
    user = os.environ.get("MODEL_USER", "").strip()
    password = os.environ.get("MODEL_PASSWORD", "").strip()
    if not user or not password:
        return {}
    token = b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return {"Authorization": f"Basic {token}"}


def _llm() -> ChatOpenAI:
    headers = _basic_auth_headers()
    return ChatOpenAI(
        base_url=MODEL_URL,
        api_key=os.environ.get("OPENAI_API_KEY", "mock"),
        model=MODEL_NAME,
        temperature=0.2,
        default_headers=headers if headers else None,
    )


def _truncate_text(text: str, max_chars: int) -> str:
    if max_chars <= 0:
        return ""
    return text if len(text) <= max_chars else text[:max_chars]


def _build_system_with_libs(system_base: str, lib_ids: list[str], lib_docs: dict[str, str]) -> str:
    parts = [_truncate_text(system_base, MAX_SYSTEM_PROMPT_CHARS)]
    for lid in lib_ids:
        doc = lib_docs.get(lid) or load_lib_doc(lid)
        if doc:
            parts.append(f"\n### Library: {lid}\n{_truncate_text(doc, MAX_LIB_DOC_CHARS)}")
    return "\n".join(parts)


def run_generate(
    run_id: str,
    field_explanations: list[dict[str, str]],
    user_prompt: str,
    main_cube_name: str,
    main_cube_data: list[dict[str, Any]],
) -> tuple[str, list[str]]:
    """Generate initial HTML snippet; save raw snippet and summary to Redis. Returns (raw_snippet, libraries_used)."""
    action_items = split_into_action_items(user_prompt, 5)
    system_base = load_system_prompt()
    hint_ids = hint_libs_from_prompt(user_prompt)
    # Keep context compact for small local models: use only directly hinted libs.
    lib_ids = hint_ids[:MAX_LIB_DOCS]
    lib_docs = {lid: load_lib_doc(lid) for lid in lib_ids}
    system_with_libs = _build_system_with_libs(system_base, lib_ids, lib_docs)

    sample = main_cube_data[:3] if main_cube_data else []
    user_msg = build_user_message(
        field_explanations,
        user_prompt,
        main_cube_name,
        sample,
        action_items,
    )

    llm = _llm()
    messages = [
        SystemMessage(content=system_with_libs),
        HumanMessage(content=user_msg),
    ]
    response = llm.invoke(messages)
    content = response.content if hasattr(response, "content") else str(response)
    raw_snippet, libraries_used = parse_llm_response(content)

    summary = f"Prompt: {user_prompt[:500]}. Action items: {action_items}. Libraries: {libraries_used}"
    if len(summary) > 100_000:
        summary = summary[:100_000]
    save_run(run_id, raw_snippet, summary, libraries_used)
    return raw_snippet, libraries_used


def run_feedback(run_id: str, feedback: str) -> tuple[str, list[str]]:
    """Apply feedback to existing run; load summary and snippet from Redis, return new (raw_snippet, libraries_used)."""
    data = load_run(run_id)
    if not data:
        raise KeyError(f"run not found: {run_id}")
    previous_snippet = data["raw_snippet"]
    previous_summary = data["summary"]
    previous_libs = data.get("libraries_used") or []

    action_items = split_into_action_items(feedback, 3)
    system_base = load_system_prompt()
    hint_ids = hint_libs_from_prompt(feedback)
    lib_ids = (hint_ids if hint_ids else previous_libs)[:MAX_LIB_DOCS]
    lib_docs = {lid: load_lib_doc(lid) for lid in lib_ids}
    system_with_libs = _build_system_with_libs(system_base, lib_ids, lib_docs)

    user_msg = (
        "Previous snippet (for context):\n"
        "<pre>\n"
        + previous_snippet[:8000]
        + "\n</pre>\n\n"
        + build_feedback_user_message(feedback, action_items)
    )

    llm = _llm()
    messages = [
        SystemMessage(content=system_with_libs),
        HumanMessage(content=user_msg),
    ]
    response = llm.invoke(messages)
    content = response.content if hasattr(response, "content") else str(response)
    raw_snippet, libraries_used = parse_llm_response(content)

    summary = f"{previous_summary}\nFeedback: {feedback[:500]}. New libraries: {libraries_used}"
    if len(summary) > 100_000:
        summary = summary[:100_000]
    save_run(run_id, raw_snippet, summary, libraries_used)
    return raw_snippet, libraries_used
