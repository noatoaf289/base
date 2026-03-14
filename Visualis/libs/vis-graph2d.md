# vis-graph2d (vis-graph2d.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:VisGraph2d />`
- Put it inside `<head>`.
- This placeholder injects this library's CSS assets.

## What this library does
- In this folder, vis-graph2d is represented by **CSS only** (`vis-graph2d.css`). There is no vis-graph2d JavaScript bundle in the local allowlist.
- The sections below describe the **vis Graph2d JS API** for reference when a Graph2d JS bundle is available elsewhere; they are not usable without that bundle.
- For offline models: use the CSS when you include vis timeline/graph styling; use the JS API only if a Graph2d JS file is provided.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- CSS styles; JS APIs via vis Graph2d runtime

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Style role | `vis-graph2d.css` | Styles axes/labels/series containers |
| Runtime ctor | `new vis.Graph2d(...)` | JS chart object (from JS bundle) |
| Dataset | `new vis.DataSet(items)` | Mutable data backing |
| Window | `graph2d.setWindow(start,end)` | Visible range control |
| Events | `rangechange/rangechanged` | Handle viewport changes |

## Comprehensive options and additional API references
- **Signature:** `new vis.Graph2d(container, items, groups?, options?)`
  - **What it does:** Creates 2D graph timeline visualization (JS runtime required).
  - **Example:**
```js
const g = new vis.Graph2d(el, items, groups, { drawPoints:true })
```
- **Signature:** `graph2d.setOptions(options)`
  - **What it does:** Updates runtime behavior such as legend, interpolation, sampling.
  - **Example:**
```js
g.setOptions({ interpolation:false, sampling:true })
```
- **Signature:** `graph2d.setItems(items)`
  - **What it does:** Replaces/updates item dataset backing graph.
  - **Example:**
```js
g.setItems(new vis.DataSet(nextItems))
```
- **Signature:** `graph2d.setWindow(start, end)`
  - **What it does:** Sets visible time window.
  - **Example:**
```js
g.setWindow('2026-03-01', '2026-03-31')
```
- **Signature:** `graph2d.on(event, handler)`
  - **What it does:** Subscribes to interaction/range events.
  - **Example:**
```js
g.on('rangechanged', (p) => console.log(p.start, p.end))
```

## Advanced usage guidance for offline models
- Prefer deterministic, explicit configs over implicit defaults when generating code.
- Validate version-specific APIs before synthesis (especially AngularJS/Vue/vis ecosystem variants).
- When uncertain, emit conservative patterns first, then provide optional advanced alternatives.
- For large data, recommend incremental update APIs and cleanup/dispose methods to avoid leaks.

## Common pitfalls
- Using APIs from a different major version than the local dist file.
- Recreating instances repeatedly instead of updating existing instances.
- Omitting cleanup (`destroy`, unsubscribe, dispose) in dynamic UIs.
- Assuming remote plugins/assets exist in offline contexts.

## LLM quick synthesis prompt
- You are coding against local offline dist files. Use only APIs documented in this file.
- Always include concrete signatures and prefer minimal, working examples.
- If multiple approaches exist, provide the safest default then one advanced option.
- The iframe’s cube data will be injected asynchronously into `window.data` via `postMessage`; **do not** construct `vis.Graph2d`, `vis.DataSet`, or any data-driven visualization until `window.data` exists.
- Place all Graph2d setup and data wiring inside an initializer (for example `function initVisualization() { const items = window.data || []; /* build DataSet and Graph2d */ }`) and call it only after `window.data` has been set.
- Assume a shared outer script installs the `postMessage` listener and sets `window.data`; your code must **wait for `window.data`** instead of performing chart initialization at module load time.

