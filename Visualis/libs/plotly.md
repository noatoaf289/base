# Plotly.js (plotly.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Plotly />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Plotly.js is an interactive charting platform supporting 2D/3D/statistical/geospatial traces.
- The rendering model uses traces + layout + config and supports incremental updates/events.
- It is powerful for exploratory analytics and dashboard interactions.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.Plotly

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Render | `Plotly.newPlot(div,data,layout,config)` | Initial chart |
| Fast rerender | `Plotly.react(...)` | Efficient diff update |
| Data patch | `Plotly.restyle(...)` | Modify trace props |
| Layout patch | `Plotly.relayout(...)` | Modify axes/layout |
| Events | `div.on('plotly_click',fn)` | Handle interactions |

## Comprehensive options and additional API references
- **Signature:** `Plotly.newPlot(gd, data, layout?, config?)`
  - **What it does:** Creates a new plot in graph div.
  - **Example:**
```js
Plotly.newPlot('chart', [{x:[1,2], y:[3,4], type:'scatter'}])
```
- **Signature:** `Plotly.react(gd, data, layout?, config?)`
  - **What it does:** Efficiently updates existing plot with diffing.
  - **Example:**
```js
Plotly.react('chart', nextData, nextLayout)
```
- **Signature:** `Plotly.restyle(gd, update, traces?)`
  - **What it does:** Patches trace-level attributes without full redraw.
  - **Example:**
```js
Plotly.restyle('chart', { marker:{ color:'red' } }, [0])
```
- **Signature:** `Plotly.relayout(gd, layoutUpdate)`
  - **What it does:** Patches layout fields like axis ranges/titles.
  - **Example:**
```js
Plotly.relayout('chart', { 'yaxis.range':[0, 100] })
```
- **Signature:** `Plotly.extendTraces(gd, update, traces, maxPoints?)`
  - **What it does:** Appends streaming points to traces.
  - **Example:**
```js
Plotly.extendTraces('chart', { y:[[42]], x:[[5]] }, [0], 200)
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

