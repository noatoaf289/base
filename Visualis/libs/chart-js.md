# Chart.js (chart-js.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:ChartJs />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Chart.js renders charts on canvas from declarative config objects.
- The engine maps datasets to chart controllers, scales, plugins, and animation pipelines.
- Use update/reactive methods to mutate visual state without full remount.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.Chart

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Create chart | `new Chart(ctx, config)` | Build chart instance |
| Update data | `chart.update()` | Rerender with new points |
| Register plugin | `Chart.register(plugin)` | Attach lifecycle hook |
| Destroy | `chart.destroy()` | Release canvas resources |
| Scale options | `options.scales.y` | Control axis behavior |

## Comprehensive options and additional API references
- **Signature:** `new Chart(ctx: CanvasRenderingContext2D|HTMLCanvasElement, config: ChartConfiguration)`
  - **What it does:** Creates chart with type/data/options.
  - **Example:**
```js
const c = new Chart(ctx, { type:'line', data, options })
```
- **Signature:** `ChartConfiguration.options.interaction`
  - **What it does:** Controls hover/click interaction mode and axis.
  - **Example:**
```js
options: { interaction:{ mode:'index', intersect:false } }
```
- **Signature:** `ChartConfiguration.options.plugins.tooltip`
  - **What it does:** Configures tooltip callbacks and display behavior.
  - **Example:**
```js
plugins:{ tooltip:{ enabled:true } }
```
- **Signature:** `chart.update(mode?)`
  - **What it does:** Recomputes scales/elements and redraws chart.
  - **Example:**
```js
chart.data.datasets[0].data.push(42); chart.update()
```
- **Signature:** `Chart.register(...componentsOrPlugins)`
  - **What it does:** Registers controllers, scales, elements, plugins in modular builds.
  - **Example:**
```js
Chart.register(LineController, LineElement)
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

