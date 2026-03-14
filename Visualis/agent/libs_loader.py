"""Load lib .md docs and system prompt from libs dir."""
from __future__ import annotations

import os
from pathlib import Path

LIBS_ROOT = os.environ.get("LIBS_ROOT", str(Path(__file__).resolve().parents[1] / "libs"))


def _libs_path() -> Path:
    return Path(LIBS_ROOT)


def load_system_prompt() -> str:
    p = _libs_path() / "system-prompt.md"
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8")


def load_lib_doc(lib_id: str) -> str:
    """Load lib documentation by id (e.g. 'chart-js' -> libs/chart-js.md)."""
    p = _libs_path() / f"{lib_id}.md"
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8")


def list_lib_doc_ids() -> list[str]:
    """Return list of lib ids that have a .md file (excluding system-prompt)."""
    ids = []
    for f in _libs_path().iterdir():
        if f.suffix == ".md" and f.stem != "system-prompt":
            ids.append(f.stem)
    return sorted(ids)
