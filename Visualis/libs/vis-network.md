# vis-network (vis-network.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:VisNetwork />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- vis-network is an interactive graph/network visualization engine.
- It combines mutable DataSet sources with physics solvers and interaction controls.
- Ideal for dependency maps, topology, entity relationship exploration.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- vis.Network
- vis.DataSet

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Ctor | `new vis.Network(el,{nodes,edges},opts)` | Create graph canvas |
| Physics | `opts.physics` | Control stabilization and force solver |
| Layout | `opts.layout.hierarchical` | Tree-like structure |
| Selection | `network.selectNodes(ids)` | Programmatic selection |
| Events | `network.on('click',fn)` | Interaction callbacks |

## Comprehensive options and additional API references
- **Signature:** `new vis.Network(container, data, options?)`
  - **What it does:** Constructs network graph with nodes/edges datasets.
  - **Example:**
```js
const net = new vis.Network(el, { nodes, edges }, { physics:true })
```
- **Signature:** `Network options.physics`
  - **What it does:** Configures solver, stabilization, spring/repulsion parameters.
  - **Example:**
```js
net.setOptions({ physics:{ stabilization:{ iterations:200 } } })
```
- **Signature:** `Network options.layout.hierarchical`
  - **What it does:** Enables layered directional graph layout.
  - **Example:**
```js
net.setOptions({ layout:{ hierarchical:{ direction:'UD' } } })
```
- **Signature:** `network.fit(options?)`
  - **What it does:** Adjusts viewport to include all or selected nodes.
  - **Example:**
```js
net.fit({ animation:true })
```
- **Signature:** `network.on(event, handler)`
  - **What it does:** Subscribes to click/select/drag/zoom/stabilized events.
  - **Example:**
```js
net.on('selectNode', (p) => console.log(p.nodes))
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

