# Monaco Editor (`monaco-editor.js` + `monaco-editor.css` + `monaco-editor.wasm`)

## Summary
- Monaco Editor provides rich in-browser code editing with syntax highlighting, IntelliSense-like behavior, and editor ergonomics.
- This repo integrates the `wc-monaco-editor` web component so HTML snippets can use a declarative `<wc-monaco-editor>` tag.

## Browser-ready files in this repo
- `libs/monaco-editor.js` (loader helper that imports the web component bundle)
- `libs/monaco-editor.css` (baseline editor container styling)
- `libs/monaco-editor.wasm` (placeholder WASM file for asset consistency; the current wc-monaco-editor integration does not require it)
- Supporting files:
  - `libs/wc-monaco-editor/index.js`
  - `libs/wc-monaco-editor/index.min.js`
  - `libs/wc-monaco-editor/monaco/*`

## Source and references
- Repo: https://github.com/vanillawc/wc-monaco-editor
- README usage patterns are mirrored here (attributes, properties, and examples).

## Installation / update flow
1. Download package:
   - `npm pack @vanillawc/wc-monaco-editor`
2. Copy:
   - `package/index.js` -> `libs/wc-monaco-editor/index.js`
   - `package/index.min.js` -> `libs/wc-monaco-editor/index.min.js`
   - `package/monaco` -> `libs/wc-monaco-editor/monaco`
3. Keep `libs/monaco-editor.js` as the local loader shim.

## Placeholder tag and where to put it
- Placeholder tag: `<Library:MonacoEditor />`
- Put it inside `<head>`.
- After injection, `window.loadMonacoEditor()` becomes available and preloads the component script.

## Attributes and properties (from upstream docs)
- Attributes:
  - `id` (required when multiple editors exist)
  - `src`, `language`, `font-size`, `tab-size`
  - `no-minimap`, `word-wrap`, `wrap-indent`
- Properties:
  - `editor` (Monaco instance)
  - `src`, `value`, `tabSize`

## HTML snippet: JavaScript editor with syntax highlighting
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Monaco JavaScript Editor</title>
    <Library:MonacoEditor />
    <style>
      body { margin: 16px; font-family: system-ui, sans-serif; }
      #editorWrap { height: 360px; }
    </style>
  </head>
  <body>
    <h2>JavaScript editor</h2>
    <div id="editorWrap">
      <wc-monaco-editor
        id="jsEditor"
        language="javascript"
        no-minimap
        word-wrap
        style="height: 100%; width: 100%;"
      ></wc-monaco-editor>
    </div>

    <script>
      const editor = document.getElementById("jsEditor");
      editor.value = [
        "function total(items) {",
        "  return items.reduce((sum, item) => sum + item.amount, 0);",
        "}",
        "",
        "console.log(total([{ amount: 4 }, { amount: 6 }]));"
      ].join("\\n");
    </script>
  </body>
</html>
```

## Common pitfalls
- Loading the component before static files are accessible under `/libs/wc-monaco-editor/...`.
- Reusing duplicate `id` values for multiple editors on one page.
- Expecting module-style imports in generated snippets; this integration is loader-driven via placeholder injection.
