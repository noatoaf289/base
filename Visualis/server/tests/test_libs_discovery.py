"""TDD: Lib discovery returns descriptors with id, name, type, files."""
from __future__ import annotations

from server.libs_discovery import discover_libs


def test_discover_libs_returns_list() -> None:
    libs = discover_libs()
    assert isinstance(libs, list)


def test_each_descriptor_has_id_name_type_files() -> None:
    libs = discover_libs()
    for d in libs:
        assert "id" in d and isinstance(d["id"], str)
        assert "name" in d and isinstance(d["name"], str)
        assert d["type"] in ("js", "css", "js-css")
        assert "files" in d and isinstance(d["files"], dict)


def test_js_only_lib_has_type_js() -> None:
    libs = discover_libs()
    lodash = next((lib for lib in libs if lib["id"] == "lodash"), None)
    if lodash:
        assert lodash["type"] == "js"
        assert "js" in lodash["files"]
        assert "css" not in lodash["files"]


def test_js_css_lib_has_type_js_css() -> None:
    libs = discover_libs()
    bootstrap = next((lib for lib in libs if lib["id"] == "bootstrap"), None)
    if bootstrap:
        assert bootstrap["type"] == "js-css"
        assert "js" in bootstrap["files"] and "css" in bootstrap["files"]
