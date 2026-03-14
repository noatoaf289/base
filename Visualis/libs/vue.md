# Vue (vue.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Vue />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Vue is a component/reactivity framework with declarative templates.
- Global builds allow direct browser usage and can expose Vue 2 or Vue 3 APIs depending on distribution.
- Model updates trigger reactive render updates while preserving component boundaries and lifecycle hooks.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.Vue

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Bind text | `{{ value }}` | Reactive interpolation |
| Two-way form | `v-model='name'` | Input sync |
| Condition | `v-if='ok'` | Conditional render |
| List | `v-for='u in users'` | Repeat template |
| Event | `@click='save()'` | User interaction |

## Comprehensive options and additional API references
- **Signature:** `Vue 2: new Vue(options)`
  - **What it does:** Creates root Vue instance with options object.
  - **Example:**
```js
new Vue({ el:'#app', data:{ n:0 }, methods:{ inc(){ this.n++ } } })
```
- **Signature:** `Vue 3: Vue.createApp(rootComponent)`
  - **What it does:** Creates application instance to mount/unmount and register components.
  - **Example:**
```js
const app = Vue.createApp({ data:()=>({ msg:'hi' }) }); app.mount('#app')
```
- **Signature:** `Directive v-model`
  - **What it does:** Binds form control value to reactive state with optional modifiers.
  - **Example:**
```js
<input v-model.trim='query' />
```
- **Signature:** `Component options: data, props, computed, methods, watch`
  - **What it does:** Defines core behavior and derived state.
  - **Example:**
```js
computed:{ full(){ return this.first + ' ' + this.last } }
```
- **Signature:** `Lifecycle hooks (v2/v3 naming varies)`
  - **What it does:** Run code around creation/mount/update/unmount phases.
  - **Example:**
```js
mounted(){ this.load() }
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

