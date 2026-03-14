# Lodash (lodash.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Lodash />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Lodash is a utility toolkit for arrays, objects, functions, and collections.
- It provides consistency across edge cases and concise high-level transformations.
- It includes function control helpers (debounce/throttle/memoize) and deep object operations.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window._

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Safe access | `_.get(obj,'a.b',def)` | Nested read with fallback |
| Group | `_.groupBy(arr,'type')` | Bucket collection |
| Sort | `_.orderBy(arr,['k'],['desc'])` | Multi-key ordering |
| Debounce | `_.debounce(fn, 200)` | Rate-limit rapid events |
| Deep clone | `_.cloneDeep(v)` | Recursive copy |

## Comprehensive options and additional API references
- **Signature:** `_.get(object, path, defaultValue?)`
  - **What it does:** Reads deep property safely.
  - **Example:**
```js
const lang = _.get(cfg, 'user.pref.lang', 'en')
```
- **Signature:** `_.set(object, path, value)`
  - **What it does:** Writes deep property path, creating containers as needed.
  - **Example:**
```js
_.set(state, 'filters.date.from', '2026-03-10')
```
- **Signature:** `_.groupBy(collection, iteratee)`
  - **What it does:** Groups values by iteratee return key.
  - **Example:**
```js
const byType = _.groupBy(items, 'type')
```
- **Signature:** `_.orderBy(collection, iteratees?, orders?)`
  - **What it does:** Sorts collection by multiple keys and sort directions.
  - **Example:**
```js
_.orderBy(users, ['lastName','age'], ['asc','desc'])
```
- **Signature:** `_.debounce(func, wait, options?)`
  - **What it does:** Returns delayed invoker with leading/trailing control.
  - **Example:**
```js
const onInput = _.debounce(search, 250, { trailing:true })
```
- **Signature:** `_.throttle(func, wait, options?)`
  - **What it does:** Invokes at most once per wait period; options include leading/trailing.
  - **Example:**
```js
const onScroll = _.throttle(handler, 100)
```
- **Signature:** `_.cloneDeep(value)`
  - **What it does:** Recursive deep copy of arrays and plain objects.
  - **Example:**
```js
const copy = _.cloneDeep(state)
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
- The iframe’s cube data arrives asynchronously into `window.data` via `postMessage`; **do not** run Lodash-powered data processing, aggregation, or rendering logic until `window.data` is available.
- Encapsulate Lodash-heavy logic in an explicit initializer (for example `function initVisualization() { const rows = window.data || []; /* ... */ }`) and ensure this initializer is only invoked after `window.data` has been populated.
- Rely on a shared outer listener that assigns into `window.data`; your snippet must simply **wait for `window.data`** rather than assuming data is present at initial script execution.

