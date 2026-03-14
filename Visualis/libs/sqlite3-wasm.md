# SQLite3 WASM (`sqlite3-wasm.js` + `sqlite3-wasm.css` + `sqlite3-wasm.wasm`)

## Summary
- SQLite3 WASM brings a full SQLite engine to the browser using WebAssembly.
- Use it when you need SQL querying, joins, aggregations, and filtering on client-side cube data without a backend roundtrip.

## Browser-ready files in this repo
- `libs/sqlite3-wasm.js` (loader helper that exposes `window.loadSqlite3`)
- `libs/sqlite3-wasm.css` (optional table styling for query results)
- `libs/sqlite3-wasm.wasm` (SQLite WASM binary)
- `libs/sqlite3-wasm.mjs` (runtime module used by `sqlite3-wasm.js`)

## Upstream source used
- npm package: `@sqlite.org/sqlite-wasm`
- Official docs: https://sqlite.org/wasm

## Installation / update flow
1. Download assets from npm:
   - `npm pack @sqlite.org/sqlite-wasm`
2. Copy:
   - `package/dist/index.mjs` -> `libs/sqlite3-wasm.mjs`
   - `package/dist/sqlite3.wasm` -> `libs/sqlite3-wasm.wasm`
3. Keep `libs/sqlite3-wasm.js` as the browser loader shim that calls the module with the correct `locateFile` path.

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Sqlite3Wasm />`
- Place this tag inside `<head>` of the generated HTML.
- The backend replaces it with the actual `<script src="/libs/sqlite3-wasm.js"></script>` and `<link rel="stylesheet" ...>` tags.

## Core API (quick guide)
- `window.loadSqlite3(options?)` -> initializes SQLite module.
- `sqlite3.oo1.DB(":memory:", "ct")` -> creates in-memory database.
- `db.exec(sql, options?)` -> executes SQL and can map rows.
- `db.close()` -> releases DB resources.

## Full single-file HTML example (with placeholder tag)
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SQLite3 WASM Cube Filter</title>
    <Library:Sqlite3Wasm />
    <style>
      body { font-family: system-ui, sans-serif; margin: 16px; }
      .row { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
      input { width: 120px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h2>Filter cube rows with SQLite in-browser</h2>
    <p>This example uses the actual injected <code>window.data</code> rows and infers columns/one numeric field for filtering.</p>
    <div class="row">
      <label for="minAmount">Min amount:</label>
      <input id="minAmount" type="number" value="100" />
      <button id="runBtn" type="button">Run filter</button>
    </div>
    <div id="status">Initializing...</div>
    <div id="results"></div>

    <script>
      const statusEl = document.getElementById("status");
      const resultsEl = document.getElementById("results");
      const runBtn = document.getElementById("runBtn");
      const minAmountInput = document.getElementById("minAmount");

      const normalizeIdentifier = (value) => {
        const cleaned = String(value || "").replace(/[^a-zA-Z0-9_]/g, "_");
        return cleaned || "col";
      };

      const waitForInjectedData = (timeoutMs = 15000) => {
        const startedAt = Date.now();
        return new Promise((resolve, reject) => {
          const check = () => {
            if (Array.isArray(window.data)) {
              resolve(window.data);
              return;
            }
            if (Date.now() - startedAt > timeoutMs) {
              reject(new Error("Timed out waiting for injected window.data."));
              return;
            }
            setTimeout(check, 100);
          };
          check();
        });
      };

      const inferFilterableField = (rows, fields) => {
        const isNumeric = (value) => value !== null && value !== "" && Number.isFinite(Number(value));
        return fields.find((field) => rows.some((row) => isNumeric(row[field])));
      };

      const renderTable = (rows) => {
        if (!rows.length) {
          resultsEl.innerHTML = "<p>No rows match filter.</p>";
          return;
        }
        const headers = Object.keys(rows[0]);
        const headHtml = headers.map((h) => `<th>${h}</th>`).join("");
        const bodyHtml = rows
          .map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`)
          .join("");
        resultsEl.innerHTML = `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
      };

      const run = async () => {
        statusEl.textContent = "Loading sqlite3 module...";
        const sqlite3 = await window.loadSqlite3();
        const db = new sqlite3.oo1.DB(":memory:", "ct");
        try {
          statusEl.textContent = "Waiting for injected cube data...";
          const rows = await waitForInjectedData();
          if (!rows.length || typeof rows[0] !== "object" || rows[0] === null) {
            statusEl.textContent = "No rows available in window.data.";
            resultsEl.innerHTML = "";
            return;
          }

          const originalFields = Object.keys(rows[0]);
          const safeFields = originalFields.map(normalizeIdentifier);
          const columnPairs = originalFields.map((field, index) => ({
            source: field,
            safe: safeFields[index]
          }));
          const inferredField = inferFilterableField(rows, originalFields);
          if (!inferredField) {
            statusEl.textContent = "No numeric-like field found for filtering.";
            resultsEl.innerHTML = "";
            return;
          }
          const inferredSafeField = normalizeIdentifier(inferredField);

          const createSql = `CREATE TABLE cube (${columnPairs.map((c) => `"${c.safe}" TEXT`).join(", ")})`;
          db.exec(createSql);
          const insertSql = `INSERT INTO cube(${columnPairs.map((c) => `"${c.safe}"`).join(", ")}) VALUES (${columnPairs.map(() => "?").join(", ")})`;
          const insert = db.prepare(insertSql);
          for (const row of rows) {
            const params = columnPairs.map((c) => {
              const value = row[c.source];
              return value === null || value === undefined ? "" : String(value);
            });
            insert.bind(params).stepReset();
          }
          insert.finalize();

          const minAmount = Number(minAmountInput.value || 0);
          const filtered = db.exec({
            sql: `SELECT * FROM cube WHERE CAST("${inferredSafeField}" AS REAL) >= ? ORDER BY CAST("${inferredSafeField}" AS REAL) DESC`,
            bind: [minAmount],
            rowMode: "object",
            resultRows: []
          });
          statusEl.textContent = `Loaded ${rows.length} rows from window.data. Filtered by "${inferredField}" >= ${minAmount}.`;
          renderTable(filtered);
        } finally {
          db.close();
        }
      };

      runBtn.addEventListener("click", () => {
        run().catch((error) => {
          statusEl.textContent = `Error: ${error.message}`;
        });
      });

      run().catch((error) => {
        statusEl.textContent = `Error: ${error.message}`;
      });
    </script>
  </body>
</html>
```

## Common pitfalls
- Not serving `.wasm` with the correct MIME type (`application/wasm`).
- Forgetting to close the DB handle (`db.close()`), which can leak memory.
- Assuming arbitrary cube fields; define a table schema that matches your expected `window.data` shape.
