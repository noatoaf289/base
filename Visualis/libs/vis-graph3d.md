# vis-graph3d (vis-graph3d.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:VisGraph3d />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- vis Graph3d renders interactive 3D plots from x/y/z points.
- It supports multiple visual styles (surface/bar/dot/grid variants) and camera interaction.
- Data can be provided as arrays or vis.DataSet entries with optional style/filter fields.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- vis.Graph3d
- vis.DataSet

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Ctor | `new vis.Graph3d(el,data,opts)` | Create 3D chart |
| Style mode | `opts.style='surface'` | Choose rendering mode |
| Camera | `opts.cameraPosition` | Control viewpoint |
| Update data | `graph.setData(data)` | Replace dataset |
| Redraw | `graph.redraw()` | Recompute rendering |

## Comprehensive options and additional API references
- **Signature:** `new vis.Graph3d(container, data, options?)`
  - **What it does:** Creates 3D graph instance.
  - **Example:**
```js
const g3 = new vis.Graph3d(el, data, { style:'surface' })
```
- **Signature:** `Graph3d options.style`
  - **What it does:** Sets rendering type: dot, grid, bar, surface, etc.
  - **Example:**
```js
g3.setOptions({ style:'dot-color' })
```
- **Signature:** `Graph3d options.cameraPosition`
  - **What it does:** Initial/updated camera position for perspective.
  - **Example:**
```js
g3.setOptions({ cameraPosition:{ horizontal:1.0, vertical:0.5, distance:1.8 } })
```
- **Signature:** `graph3d.setData(data)`
  - **What it does:** Replaces graph data source.
  - **Example:**
```js
g3.setData(new vis.DataSet(nextPoints))
```
- **Signature:** `graph3d.setOptions(options)`
  - **What it does:** Patches visual and interaction options.
  - **Example:**
```js
g3.setOptions({ showGrid:true, verticalRatio:0.6 })
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

