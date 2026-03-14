"""TDD: Lib placeholder replacement and data listener injection."""
from __future__ import annotations

from unittest.mock import patch

from server.inject_libs import inject_libs_into_html

DESCRIPTORS = [
    {"id": "lodash", "name": "Lodash", "type": "js", "files": {"js": "lodash.js"}},
    {"id": "chart-js", "name": "Chart.js", "type": "js", "files": {"js": "chart-js.js"}},
    {"id": "leaflet", "name": "Leaflet", "type": "js-css", "files": {"js": "leaflet.js", "css": "leaflet.css"}},
]


def test_inject_replaces_placeholder_with_script_link() -> None:
    html = "<!DOCTYPE html><html><head><Library:Lodash /></head><body></body></html>"
    out, libs = inject_libs_into_html(html, DESCRIPTORS, ["lodash"])
    assert "lodash" in libs
    assert "<Library:Lodash />" not in out
    assert "script" in out.lower() and "lodash.js" in out
    assert "window.data" in out
    assert "message" in out or "postMessage" in out.lower()


def test_inject_empty_lib_ids_unchanged_placeholders() -> None:
    html = "<html><head></head><body>x</body></html>"
    out, libs = inject_libs_into_html(html, DESCRIPTORS, [])
    assert libs == []
    assert "window.data" in out


def test_inject_unknown_lib_id_skipped() -> None:
    html = "<html><head><Library:Lodash /></head><body></body></html>"
    out, libs = inject_libs_into_html(html, DESCRIPTORS, ["nonexistent"])
    assert libs == []
    assert "<Library:Lodash />" in out


@patch("server.inject_libs.BASE_URL", "http://localhost:8000")
def test_inject_uses_base_url_for_src() -> None:
    html = "<!DOCTYPE html><html><head><Library:Lodash /></head><body></body></html>"
    out, _ = inject_libs_into_html(html, DESCRIPTORS, ["lodash"])
    assert "http://localhost:8000/libs/lodash.js" in out
