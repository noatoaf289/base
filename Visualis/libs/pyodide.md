# Pyodide (`pyodide.js` + `pyodide.css` + `pyodide.wasm`)

## Summary
- Pyodide runs Python in the browser by compiling CPython and scientific tooling to WebAssembly.
- Use it when users need Python transformations or analytics in a client-only HTML runtime.

## Browser-ready files in this repo
- `libs/pyodide.js` (legacy browser loader exposing `loadPyodide`)
- `libs/pyodide.css` (optional UI styles)
- `libs/pyodide.wasm` (copied alias of `pyodide.asm.wasm`)
- Required runtime sidecars:
  - `libs/pyodide.asm.js`
  - `libs/pyodide.asm.wasm`
  - `libs/python_stdlib.zip`
  - `libs/pyodide-lock.json`

## Upstream source used
- npm package: `pyodide`
- Docs: https://pyodide.org/en/stable/usage/downloading-and-deploying.html

## Installation / update flow
1. Download assets:
   - `npm pack pyodide`
2. Copy the runtime files listed above into `libs/`.
3. Keep all files in the same folder because `loadPyodide({ indexURL })` expects sibling assets.

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Pyodide />`
- Place it inside `<head>`.
- The backend injects the real script/link tags, then your script can call `loadPyodide(...)`.

## Core API (quick guide)
- `loadPyodide({ indexURL })` -> boots the runtime.
- `pyodide.runPython(code)` -> executes Python and returns converted results.
- `pyodide.runPythonAsync(code)` -> async Python execution (better for heavy tasks).
- `pyodide.loadPackage(nameOrArray)` -> load optional Python packages.

## Full single-file HTML example (with placeholder tag)
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Pyodide Single File Example</title>
    <Library:Pyodide />
    <style>
      body { font-family: system-ui, sans-serif; margin: 16px; }
      textarea { width: 100%; height: 180px; font-family: ui-monospace, monospace; }
      button { margin-top: 8px; }
      pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h2>Run Python in-browser with Pyodide</h2>
    <p>When available, this example reads row count from <code>window.data</code>.</p>
    <textarea id="pythonCode">import json
rows = js.window.data if js.window.data else []
count = len(rows)
first = rows[0] if count > 0 else {"message": "no data"}
result = {
  "rows_count": count,
  "first_row": first
}
json.dumps(result, indent=2)</textarea>
    <br />
    <button id="runPy" type="button">Run Python</button>
    <div id="status">Loading Pyodide...</div>
    <pre id="output"></pre>

    <script>
      const statusEl = document.getElementById("status");
      const outputEl = document.getElementById("output");
      const codeEl = document.getElementById("pythonCode");
      const runBtn = document.getElementById("runPy");

      let pyodideInstance = null;

      const loadRuntime = async () => {
        pyodideInstance = await loadPyodide({
          indexURL: "/libs/"
        });
        statusEl.textContent = "Pyodide ready.";
      };

      const runPython = async () => {
        if (!pyodideInstance) return;
        statusEl.textContent = "Running Python...";
        try {
          // Expose JS bridge in Python via `js`
          pyodideInstance.globals.set("js", window);
          const result = await pyodideInstance.runPythonAsync(codeEl.value);
          outputEl.textContent = String(result);
          statusEl.textContent = "Execution complete.";
        } catch (error) {
          outputEl.textContent = String(error);
          statusEl.textContent = "Execution failed.";
        }
      };

      runBtn.addEventListener("click", () => {
        runPython().catch((error) => {
          outputEl.textContent = String(error);
        });
      });

      loadRuntime().catch((error) => {
        statusEl.textContent = `Pyodide failed to load: ${error.message}`;
      });
    </script>
  </body>
</html>
```

## Common pitfalls
- Using the wrong `indexURL` so runtime side files cannot be resolved.
- Missing `python_stdlib.zip` or `pyodide-lock.json` in the same static directory.
- Running very heavy Python code on the main thread (consider a Web Worker for large jobs).
