# jQuery (jquery.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Jquery />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- jQuery is a DOM/AJAX/event utility library with chainable collections.
- It wraps node sets and provides consistent APIs for traversal/manipulation/effects.
- Legacy-heavy ecosystems still rely on jQuery plugin conventions.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.$
- window.jQuery

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Select | `$('.item')` | Create wrapped collection |
| Events | `.on('click', fn)` | Bind handler |
| AJAX | `$.ajax({...})` | Network request |
| DOM update | `.append(node)` | Mutate DOM |
| Plugin | `$.fn.myPlugin = fn` | Extend jQuery prototype |

## Comprehensive options and additional API references
- **Signature:** `$(selector | element | html)`
  - **What it does:** Creates jQuery collection from selector or node(s).
  - **Example:**
```js
const items = $('.todo-item')
```
- **Signature:** `collection.on(events, selector?, handler)`
  - **What it does:** Attaches direct or delegated event handlers.
  - **Example:**
```js
$('#list').on('click', 'li', (e) => $(e.currentTarget).toggleClass('done'))
```
- **Signature:** `$.ajax(options)`
  - **What it does:** Low-level AJAX with rich options and callbacks.
  - **Example:**
```js
$.ajax({ url:'/api', method:'GET', dataType:'json' })
```
- **Signature:** `collection.animate(props, duration?, easing?, complete?)`
  - **What it does:** Runs timed property animations.
  - **Example:**
```js
$('.panel').animate({ height: 200 }, 300)
```
- **Signature:** `$.fn.pluginName = function(options){...}`
  - **What it does:** Defines chainable custom plugin over collection.
  - **Example:**
```js
$.fn.flash = function(){ return this.fadeOut(80).fadeIn(80) }
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

