"""Prompt building and response parsing for the agent."""
from __future__ import annotations

import re
from typing import TypedDict


class FieldExplanation(TypedDict):
    fieldName: str
    explanation: str


# Heuristic: prompt keywords -> lib ids (must match libs/*.md base names)
PROMPT_LIB_HINTS: dict[str, list[str]] = {
    "chart": ["chart-js"],
    "graph": ["vis-network", "vis-graph3d", "d3"],
    "timeline": ["vis-timeline"],
    "map": ["leaflet"],
    "plot": ["plotly", "d3"],
    "animation": ["gsap"],
    "date": ["dayjs", "moment"],
    "ajax": ["axios"],
    "dom": ["jquery"],
    "vue": ["vue"],
    "alpine": ["alpine"],
    "bootstrap": ["bootstrap"],
    "bulma": ["bulma"],
    "lodash": ["lodash"],
    "_": ["lodash"],
}


def split_into_action_items(text: str, max_items: int) -> list[str]:
    """Split user prompt/feedback into up to max_items action items (by newlines or numbering)."""
    lines = [s.strip() for s in text.splitlines() if s.strip()]
    if not lines:
        return [text.strip()] if text.strip() else []
    items = []
    for line in lines:
        if re.match(r"^\d+[.)]\s*", line):
            line = re.sub(r"^\d+[.)]\s*", "", line)
        if line:
            items.append(line)
        if len(items) >= max_items:
            break
    if not items:
        return [text.strip()] if text.strip() else []
    return items


def hint_libs_from_prompt(prompt: str) -> list[str]:
    """Suggest lib ids from prompt keywords (for loading .md into context)."""
    seen: set[str] = set()
    lower = prompt.lower()
    for keyword, libs in PROMPT_LIB_HINTS.items():
        if keyword in lower:
            for lib in libs:
                seen.add(lib)
    return sorted(seen)


def build_user_message(
    field_explanations: list[FieldExplanation],
    user_prompt: str,
    main_cube_name: str,
    main_cube_data_sample: list[dict],
    action_items: list[str],
) -> str:
    """Build the user-facing message for the LLM."""
    lines = [
        "## Field explanations (from user)",
        *[f"- {e['fieldName']}: {e['explanation']}" for e in field_explanations],
        "",
        "## Main cube",
        f"Name: {main_cube_name}",
        f"Sample row keys: {list(main_cube_data_sample[0].keys()) if main_cube_data_sample else []}",
        "",
        "## User prompt",
        user_prompt,
        "",
        "## Action items (for this task)",
        *[f"- {a}" for a in action_items],
        "",
        "Output a single HTML document (one page with embedded <style> and <script>). "
        "Data will be injected as window.data (array of objects); wait for window.data before rendering. "
        "For each library you use, insert a placeholder in <head>: <Library:TagName /> (e.g. <Library:Leaflet />, <Library:ChartJs />, <Library:Lodash />). "
        "Do not include real script/link tags for libs—only these placeholders. "
        "At the very end of your response, add a single line: LIBRARIES_USED: id1, id2 (lib ids, e.g. leaflet, chart-js, lodash).",
    ]
    return "\n".join(lines)


def parse_llm_response(response: str) -> tuple[str, list[str]]:
    """Extract HTML snippet and libraries_used from LLM response."""
    # LIBRARIES_USED: chart-js, lodash at end
    libs_match = re.search(r"LIBRARIES_USED:\s*(.+?)\s*$", response, re.IGNORECASE | re.DOTALL)
    if libs_match:
        libs_str = libs_match.group(1).strip()
        response = response[: libs_match.start()].strip()
        libraries_used = [s.strip() for s in re.split(r"[,;]", libs_str) if s.strip()]
    else:
        libraries_used = []

    # Extract HTML: optional ```html ... ``` or full response
    code_match = re.search(r"```(?:html)?\s*([\s\S]*?)```", response)
    if code_match:
        html = code_match.group(1).strip()
    else:
        html = response.strip()
    if not html.startswith("<!") and "<html" not in html.lower():
        html = "<!DOCTYPE html><html><head></head><body>" + html + "</body></html>"
    return html, libraries_used


def build_feedback_user_message(
    feedback: str,
    action_items: list[str],
) -> str:
    """Build user message for feedback loop."""
    lines = [
        "## Continuation / feedback from user",
        feedback,
        "",
        "## Action items",
        *[f"- {a}" for a in action_items],
        "",
        "Output the updated single HTML document with <Library:TagName /> placeholders in <head> for any libs used. At the end add: LIBRARIES_USED: id1, id2",
    ]
    return "\n".join(lines)
