# vis-timeline (vis-timeline.js + vis-timeline.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:VisTimeline />`
- Put it inside `<head>`.
- This placeholder injects both CSS and JavaScript assets for vis-timeline.

## What this library does
- vis-timeline renders time-oriented items/groups with pan/zoom/select interactions.
- Data is typically held in vis.DataSet instances and can be updated incrementally.
- It supports editable flows for scheduling/project planning interfaces.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- vis.Timeline
- vis.DataSet
- timeline CSS

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Ctor | `new vis.Timeline(el,items,groups,opts)` | Create timeline |
| Set window | `timeline.setWindow(start,end)` | Control visible range |
| Fit | `timeline.fit()` | Auto-range to items |
| Selection | `timeline.getSelection()` | Current item ids |
| Edit hooks | `opts.onAdd/onMove/onRemove` | Custom edit workflows |

## Comprehensive options and additional API references
- **Signature:** `new vis.Timeline(container, items, groups?, options?)`
  - **What it does:** Creates timeline component instance.
  - **Example:**
```js
const tl = new vis.Timeline(el, items, groups, { stack:true })
```
- **Signature:** `Timeline options.editable`
  - **What it does:** Enables/disables item create/update/move/remove interactions.
  - **Example:**
```js
tl.setOptions({ editable:{ add:true, updateTime:true, remove:false } })
```
- **Signature:** `timeline.setWindow(start, end, options?)`
  - **What it does:** Changes current viewport timespan.
  - **Example:**
```js
tl.setWindow('2026-03-01', '2026-03-31')
```
- **Signature:** `timeline.setItems(items)`
  - **What it does:** Replaces backing items dataset.
  - **Example:**
```js
tl.setItems(new vis.DataSet(nextItems))
```
- **Signature:** `timeline.on(event, handler)`
  - **What it does:** Listens to select/click/rangechange/timechanged events.
  - **Example:**
```js
tl.on('select', (p) => console.log(p.items))
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

