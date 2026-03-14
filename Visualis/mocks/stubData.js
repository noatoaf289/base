/** Stub package run results for Flapi mock (server-spec §2.1). */
export const stubPackageResults = {
  sales_cube: [
    { region: 'North', amount: 100, product: 'Widget A' },
    { region: 'South', amount: 150, product: 'Widget B' },
    { region: 'East', amount: 80, product: 'Widget A' },
    { region: 'West', amount: 200, product: 'Widget C' },
  ],
  users_cube: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ],
};

/** Stub lib descriptors for GET /api/libs (server-spec §3.1). */
export const stubLibs = [
  { id: 'lodash', name: 'Lodash', type: 'js', files: { js: 'lodash.js' } },
  { id: 'chart-js', name: 'Chart.js', type: 'js', files: { js: 'chart-js.js' } },
  { id: 'bootstrap', name: 'Bootstrap', type: 'js-css', files: { js: 'bootstrap.js', css: 'bootstrap.css' } },
  { id: 'normalize', name: 'Normalize.css', type: 'css', files: { css: 'normalize.css' } },
  { id: 'font-awesome', name: 'Font Awesome', type: 'js-css', files: { js: 'font-awesome.js', css: 'font-awesome.css' } },
  { id: 'leaflet', name: 'Leaflet', type: 'js-css', files: { js: 'leaflet.js', css: 'leaflet.css' } },
  {
    id: 'sqlite3-wasm',
    name: 'SQLite3 WASM',
    type: 'js-css',
    files: { js: 'sqlite3-wasm.js', css: 'sqlite3-wasm.css', wasm: 'sqlite3-wasm.wasm' },
  },
  {
    id: 'pyodide',
    name: 'Pyodide',
    type: 'js-css',
    files: { js: 'pyodide.js', css: 'pyodide.css', wasm: 'pyodide.wasm' },
  },
  {
    id: 'monaco-editor',
    name: 'Monaco Editor',
    type: 'js-css',
    files: { js: 'monaco-editor.js', css: 'monaco-editor.css', wasm: 'monaco-editor.wasm' },
  },
];

/** In-memory store for runId → snippet (mock Redis). 12h TTL not enforced in mock. */
const runStore = new Map();

/**
 * @param {string} runId
 * @param {{ htmlSnippet: string, librariesUsed: string[] }} value
 */
export const putRun = (runId, value) => {
  runStore.set(runId, value);
};

/**
 * @param {string} runId
 * @returns {{ htmlSnippet: string, librariesUsed: string[] } | undefined}
 */
export const getRun = (runId) => runStore.get(runId);
