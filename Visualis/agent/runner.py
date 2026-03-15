"""Langchain runner: generate HTML snippet and optionally save to Redis."""
from __future__ import annotations

import os
from base64 import b64encode
from typing import Any

import httpx
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.outputs import ChatGeneration, ChatResult
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
MODEL_USER = os.environ.get("MODEL_USER", "").strip()
MODEL_PASSWORD = os.environ.get("MODEL_PASSWORD", "").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "mock")

MINIMAX_BASE_URL = os.environ.get("MINIMAX_BASE_URL", "").rstrip("/")
MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY", "").strip()
MINIMAX_MODEL = os.environ.get("MINIMAX_MODEL", "mini-max-01").strip()
# Required by MiniMax native API only (error 1004). Not needed when using OpenRouter.
MINIMAX_GROUP_ID = os.environ.get("MINIMAX_GROUP_ID", "").strip()

# OpenRouter: optional gateway for MiniMax (no Group ID). https://openrouter.ai/docs
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
OPENROUTER_MINIMAX_MODEL = os.environ.get("OPENROUTER_MINIMAX_MODEL", "minimax/minimax-01").strip()

MAX_SYSTEM_PROMPT_CHARS = int(os.environ.get("MAX_SYSTEM_PROMPT_CHARS", "7000"))
MAX_LIB_DOC_CHARS = int(os.environ.get("MAX_LIB_DOC_CHARS", "1200"))
MAX_LIB_DOCS = int(os.environ.get("MAX_LIB_DOCS", "2"))


def _minimax_chatcompletion_url() -> str:
    """MiniMax native endpoint: /v1/text/chatcompletion_v2 (not OpenAI /v1/chat/completions)."""
    base = MINIMAX_BASE_URL.rstrip("/")
    if base.endswith("/v1"):
        return f"{base}/text/chatcompletion_v2"
    return f"{base}/v1/text/chatcompletion_v2"


class _MinimaxChat(BaseChatModel):
    """LangChain-compatible client for MiniMax native API (Bearer + X-Group-Id, /v1/text/chatcompletion_v2)."""

    base_url: str = ""
    api_key: str = ""
    group_id: str = ""
    model: str = MINIMAX_MODEL
    temperature: float = 0.2

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        url = _minimax_chatcompletion_url()
        # MiniMax message format: role, content, optional name
        payload_messages = []
        for m in messages:
            role = "user" if isinstance(m, HumanMessage) else "system" if isinstance(m, SystemMessage) else "assistant"
            content = m.content if isinstance(m.content, str) else str(m.content)
            payload_messages.append({"role": role, "content": content})
        body = {
            "model": self.model,
            "messages": payload_messages,
            "temperature": self.temperature,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.group_id:
            headers["X-Group-Id"] = self.group_id
        with httpx.Client(timeout=120.0) as client:
            r = client.post(url, json=body, headers=headers)
        r.raise_for_status()
        data = r.json()
        base_resp = data.get("base_resp") or {}
        if base_resp.get("status_code", 0) != 0:
            msg = base_resp.get("status_msg") or str(base_resp)
            code = base_resp.get("status_code")
            if code == 1004 and not self.group_id:
                msg = f"{msg} If using api.minimax.io, set MINIMAX_GROUP_ID in .env (Account > Your Profile, 19-digit Group ID) and restart the Agent."
            raise ValueError(f"MiniMax API error (code {code}): {msg}")
        choices = data.get("choices") or []
        if not choices:
            raise ValueError("MiniMax returned no choices")
        msg = choices[0].get("message") or {}
        content = msg.get("content") or ""
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])

    @property
    def _llm_type(self) -> str:
        return "minimax"


def _basic_auth_headers(user: str = "", password: str = "") -> dict[str, str]:
    u = user or MODEL_USER
    p = password or MODEL_PASSWORD
    if not u or not p:
        return {}
    token = b64encode(f"{u}:{p}".encode("utf-8")).decode("ascii")
    return {"Authorization": f"Basic {token}"}


def _llm(model_id: str = "default") -> BaseChatModel:
    """Return chat model for the given model_id (default = env MODEL_*, minimax = OpenRouter or MiniMax native)."""
    if model_id == "minimax":
        # Prefer OpenRouter for MiniMax: single API key, no Group ID. https://openrouter.ai/minimax
        if OPENROUTER_API_KEY and OPENROUTER_BASE_URL:
            # MiniMax-Text-01 (and similar) cap at 40000 max_tokens; keep under limit.
            return ChatOpenAI(
                base_url=OPENROUTER_BASE_URL,
                api_key=OPENROUTER_API_KEY,
                model=OPENROUTER_MINIMAX_MODEL,
                temperature=0.2,
                max_tokens=8192,
            )
        # Fallback: MiniMax native API (requires MINIMAX_GROUP_ID for api.minimax.io).
        if MINIMAX_BASE_URL and MINIMAX_API_KEY:
            return _MinimaxChat(
                base_url=MINIMAX_BASE_URL,
                api_key=MINIMAX_API_KEY,
                group_id=MINIMAX_GROUP_ID,
                model=MINIMAX_MODEL,
                temperature=0.2,
            )
    headers = _basic_auth_headers()
    return ChatOpenAI(
        base_url=MODEL_URL,
        api_key=OPENAI_API_KEY,
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
    model_id: str = "default",
) -> tuple[str, list[str]]:
    """Generate initial HTML snippet; save raw snippet and summary to Redis. Returns (raw_snippet, libraries_used)."""
    action_items = split_into_action_items(user_prompt, 5)
    system_base = load_system_prompt()
    hint_ids = hint_libs_from_prompt(user_prompt)
    # Keep context compact for small local models: use only directly hinted libs.
    lib_ids = hint_ids[:MAX_LIB_DOCS]
    lib_docs = {lid: load_lib_doc(lid) for lid in lib_ids}
    system_with_libs = _build_system_with_libs(system_base, lib_ids, lib_docs)

    # Send enough rows so tables/dashboards are populated (cap to avoid token overflow).
    sample = main_cube_data[:25] if main_cube_data else []
    user_msg = build_user_message(
        field_explanations,
        user_prompt,
        main_cube_name,
        sample,
        action_items,
    )

    llm = _llm(model_id)
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


def run_feedback(
    run_id: str, feedback: str, model_id: str = "default"
) -> tuple[str, list[str]]:
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

    llm = _llm(model_id)
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
