"""TDD: prompt utils split action items, hint libs, parse response."""
from __future__ import annotations

from agent.prompt_utils import (
    hint_libs_from_prompt,
    parse_llm_response,
    split_into_action_items,
)


def test_split_into_action_items_empty() -> None:
    assert split_into_action_items("", 5) == []
    assert split_into_action_items("   \n  ", 5) == []


def test_split_into_action_items_single_line() -> None:
    assert split_into_action_items("Make a bar chart", 5) == ["Make a bar chart"]


def test_split_into_action_items_numbered() -> None:
    text = "1. Add title\n2. Use blue\n3. Add legend"
    got = split_into_action_items(text, 5)
    assert "Add title" in got[0]
    assert "Use blue" in got[1]
    assert "Add legend" in got[2]


def test_split_into_action_items_max_five() -> None:
    lines = ["a", "b", "c", "d", "e", "f"]
    got = split_into_action_items("\n".join(lines), 5)
    assert len(got) == 5
    assert got[-1] == "e"


def test_hint_libs_chart() -> None:
    assert "chart-js" in hint_libs_from_prompt("Show a bar chart of sales")


def test_hint_libs_map() -> None:
    assert "leaflet" in hint_libs_from_prompt("Display a map")


def test_parse_llm_response_with_libraries_line() -> None:
    resp = """<!DOCTYPE html><html><body>ok</body></html>
LIBRARIES_USED: chart-js, lodash"""
    html, libs = parse_llm_response(resp)
    assert "chart-js" in libs and "lodash" in libs
    assert "<!DOCTYPE" in html and "LIBRARIES_USED" not in html


def test_parse_llm_response_code_fence() -> None:
    resp = """```html
<!DOCTYPE html><html><body>done</body></html>
```
LIBRARIES_USED: bootstrap"""
    html, libs = parse_llm_response(resp)
    assert "bootstrap" in libs
    assert "done" in html
