"""
Library placeholder injection and data-injection script.
Replaces <Library:Name /> placeholders with script/link tags (BASE_URL) and injects postMessage listener.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import TypedDict

LIBS_ROOT = os.environ.get("LIBS_ROOT", str(Path(__file__).resolve().parents[1] / "libs"))
BASE_URL = os.environ.get("BASE_URL", "").rstrip("/")
IFRAME_DATA_EVENT = os.environ.get("IFRAME_DATA_EVENT", "VISUALIS_IFRAME_DATA")


class LibFiles(TypedDict, total=False):
    js: str
    css: str
    wasm: str


class LibraryInjectionConfig(TypedDict):
    placeholder: str
    location: str
    type: str
    files: LibFiles
    lib_id: str


def _to_tag_name(name: str) -> str:
    """Turn lib display name into placeholder tag name, e.g. 'Chart.js' -> 'ChartJS'."""
    normalized = re.sub(r"[^a-zA-Z0-9\s]", " ", name)
    return "".join(w.capitalize() for w in normalized.split())


def _build_placeholder(lib_id: str, name: str) -> str:
    return f"<Library:{_to_tag_name(name or lib_id)} />"


def build_placeholder_to_config(
    lib_descriptors: list[dict],
) -> dict[str, LibraryInjectionConfig]:
    """Build mapping from placeholder string to injection config (for replacement)."""
    result: dict[str, LibraryInjectionConfig] = {}
    for d in lib_descriptors:
        lib_id = d.get("id") or ""
        name = d.get("name") or lib_id
        lib_type = d.get("type") or "js"
        files = d.get("files") or {}
        placeholder = _build_placeholder(lib_id, name)
        result[placeholder] = {
            "placeholder": placeholder,
            "location": "head",
            "type": lib_type,
            "files": files,
            "lib_id": lib_id,
        }
    return result


def _replacement_tags(config: LibraryInjectionConfig) -> str:
    """Generate script/link tags for one library using BASE_URL."""
    parts: list[str] = []
    base = BASE_URL or ""
    prefix = f"{base}/libs/" if base else "/libs/"
    files = config.get("files") or {}
    if config.get("type") in ("js-css", "css") and files.get("css"):
        parts.append(f'<link rel="stylesheet" href="{prefix}{files["css"]}" />')
    if config.get("type") in ("js-css", "js") and files.get("js"):
        parts.append(f'<script src="{prefix}{files["js"]}"></script>')
    return "\n".join(parts)


def _data_listener_script() -> str:
    """Script injected at end of body: postMessage listener -> window.data."""
    event_name = IFRAME_DATA_EVENT.replace("\\", "\\\\").replace('"', '\\"')
    return f'''<script>
(function(){{
  const eventName = "{event_name}";
  window.data = null;
  window.addEventListener("message", function(event) {{
    const message = event.data;
    if (!message || message.type !== eventName) return;
    window.data = message.payload;
  }});
}})();
</script>'''


def _tag_name_from_placeholder(placeholder: str) -> str:
    """Extract tag name from '<Library:TagName />'."""
    m = re.match(r"<Library:\s*([A-Za-z0-9]+)\s*/>", placeholder.strip())
    return m.group(1) if m else ""


def _replace_placeholders(
    html: str,
    placeholder_to_config: dict[str, LibraryInjectionConfig],
) -> tuple[str, list[str]]:
    """Replace each <Library:... /> with script/link tags; return (html, libraries_used)."""
    libraries_used: list[str] = []
    tag_to_config: dict[str, LibraryInjectionConfig] = {}
    for placeholder, config in placeholder_to_config.items():
        tag = _tag_name_from_placeholder(placeholder)
        if tag:
            tag_to_config[tag] = config
    # Match <Library:TagName /> or <Library:TagName/>
    pattern = re.compile(r"<Library:\s*([A-Za-z0-9]+)\s*/>")

    def repl(match: re.Match[str]) -> str:
        tag_name = match.group(1)
        config = tag_to_config.get(tag_name)
        if config:
            lib_id = config.get("lib_id", "")
            if lib_id and lib_id not in libraries_used:
                libraries_used.append(lib_id)
            return _replacement_tags(config)
        return match.group(0)

    html = pattern.sub(repl, html)
    return html, libraries_used


def _inject_data_listener_at_body_end(html: str) -> str:
    """Inject postMessage listener script just before </body>."""
    script = _data_listener_script()
    lower = html.lower()
    body_close = lower.rfind("</body>")
    if body_close == -1:
        return html + "\n" + script
    insert_pos = body_close
    return html[:insert_pos] + "\n" + script + "\n" + html[insert_pos:]


def inject_libs_into_html(
    html: str,
    lib_descriptors: list[dict],
    lib_ids_to_inject: list[str] | None = None,
) -> tuple[str, list[str]]:
    """
    Replace <Library:Name /> placeholders with script/link tags (BASE_URL), then inject
    data listener at end of body. Returns (final_html, libraries_used).
    If lib_ids_to_inject is given, only those placeholders are considered; otherwise
    all placeholders present in html are replaced.
    """
    placeholder_to_config = build_placeholder_to_config(lib_descriptors)
    if lib_ids_to_inject:
        # Restrict to requested libs
        allowed = set(lib_ids_to_inject)
        placeholder_to_config = {
            p: c for p, c in placeholder_to_config.items() if c.get("lib_id") in allowed
        }
    html, libraries_used = _replace_placeholders(html, placeholder_to_config)
    html = _inject_data_listener_at_body_end(html)
    return html, libraries_used
