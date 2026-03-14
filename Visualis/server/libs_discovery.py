"""Discover libs from filesystem: id, name, type (js|css|js-css), files."""
from __future__ import annotations

import os
from pathlib import Path
from typing import TypedDict

LIBS_ROOT = os.environ.get("LIBS_ROOT", str(Path(__file__).resolve().parents[1] / "libs"))


class LibFiles(TypedDict, total=False):
    js: str
    css: str
    wasm: str


class LibDescriptor(TypedDict):
    id: str
    name: str
    type: str
    files: LibFiles


def _humanize(lib_id: str) -> str:
    if lib_id == "chart-js":
        return "Chart.js"
    if lib_id == "font-awesome":
        return "Font Awesome"
    if lib_id == "sqlite3-wasm":
        return "SQLite3 WASM"
    if lib_id == "pyodide":
        return "Pyodide"
    if lib_id == "monaco-editor":
        return "Monaco Editor"
    if lib_id == "vis-graph2d":
        return "vis-graph2d"
    if lib_id == "vis-graph3d":
        return "vis-graph3d"
    if lib_id == "vis-network":
        return "vis-network"
    if lib_id == "vis-timeline":
        return "vis-timeline"
    return lib_id.replace("-", " ").title()


def discover_libs() -> list[LibDescriptor]:
    root = Path(LIBS_ROOT)
    if not root.exists():
        return []
    by_id: dict[str, LibFiles] = {}
    for f in root.iterdir():
        if f.suffix == ".js":
            by_id.setdefault(f.stem, {})["js"] = f.name
        elif f.suffix == ".css":
            by_id.setdefault(f.stem, {})["css"] = f.name
        elif f.suffix == ".wasm":
            by_id.setdefault(f.stem, {})["wasm"] = f.name
    result: list[LibDescriptor] = []
    for lib_id, files in sorted(by_id.items()):
        if lib_id.endswith(".asm"):
            # Runtime sidecars used by a parent library (e.g. pyodide.asm.js).
            continue
        has_js = "js" in files
        has_css = "css" in files
        if not has_js and not has_css:
            # Sidecar-only assets (e.g. *.asm.wasm) are not standalone libraries.
            continue
        if has_js and has_css:
            lib_type = "js-css"
        elif has_js:
            lib_type = "js"
        else:
            lib_type = "css"
        result.append({
            "id": lib_id,
            "name": _humanize(lib_id),
            "type": lib_type,
            "files": files,
        })
    return result
