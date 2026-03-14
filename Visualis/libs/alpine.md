# Alpine.js (alpine.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Alpine />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Alpine.js is a declarative micro-framework for reactive behavior directly in HTML.
- It evaluates expressions against component-scoped state objects and updates the DOM with lightweight reactivity.
- Its mental model is: markup directives define state, events mutate state, DOM reacts automatically.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.Alpine
- directive runtime for x-* attributes
- global stores and plugins

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Component state | `x-data="{ open:false }"` | Define reactive scope for an element subtree |
| Event handling | `@click="open = !open"` | Mutate state on user events |
| Conditional render | `x-show="open"` | Toggle visibility while preserving node |
| List rendering | `x-for="item in items"` | Repeat template for array values |
| Reusable data | `Alpine.data(name, factory)` | Register component factory |

## Comprehensive options and additional API references
- **Signature:** `Alpine.data(name: string, factory: (...args)=>object)`
  - **What it does:** Registers reusable component state factory.
  - **Example:**
```js
Alpine.data('counter', (n=0) => ({ count:n, inc(){ this.count++ } }))
```
- **Signature:** `Alpine.store(name: string, value: object)`
  - **What it does:** Creates a global reactive store shared across components.
  - **Example:**
```js
Alpine.store('theme', { dark:false, toggle(){ this.dark=!this.dark } })
```
- **Signature:** `Alpine.directive(name: string, handler: Function)`
  - **What it does:** Defines a custom directive for advanced behavior.
  - **Example:**
```js
Alpine.directive('focus', (el) => el.focus())
```
- **Signature:** `$watch(path: string, callback: (value, oldValue)=>void)`
  - **What it does:** Subscribes to state changes in the current component.
  - **Example:**
```js
$watch('count', (v) => console.log('count', v))
```
- **Signature:** `$dispatch(name: string, detail?: any)`
  - **What it does:** Dispatches CustomEvent for parent/sibling listeners.
  - **Example:**
```js
$dispatch('saved', { id: 7 })
```
- **Signature:** `@event modifiers (.prevent .stop .once .debounce .throttle)`
  - **What it does:** Changes event behavior and timing in templates.
  - **Example:**
```js
<button @click.prevent.once="submit()">Save</button>
```
- **Signature:** `x-model modifiers (.lazy .number .debounce)`
  - **What it does:** Controls update timing/coercion for form bindings.
  - **Example:**
```js
<input x-model.number.debounce.300ms="qty" />
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

