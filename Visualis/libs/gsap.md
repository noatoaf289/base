# GSAP (gsap.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Gsap />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- GSAP is an animation engine for DOM/SVG/object properties.
- It compiles tween vars into efficient render loops and supports timeline orchestration.
- Best for precise choreography and high-performance interactions.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.gsap

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Tween | `gsap.to(target, vars)` | Animate to values |
| From tween | `gsap.from(target, vars)` | Animate from values |
| Timeline | `gsap.timeline(opts)` | Sequence multiple tweens |
| Set | `gsap.set(target, vars)` | Apply immediate state |
| Plugin | `gsap.registerPlugin(P)` | Enable extension |

## Comprehensive options and additional API references
- **Signature:** `gsap.to(targets, vars)`
  - **What it does:** Animates target properties to desired values.
  - **Example:**
```js
gsap.to('.box', { x:200, duration:0.6 })
```
- **Signature:** `gsap.from(targets, vars)`
  - **What it does:** Animates from given values to current values.
  - **Example:**
```js
gsap.from('.item', { opacity:0, y:20, stagger:0.05 })
```
- **Signature:** `gsap.timeline(options?)`
  - **What it does:** Creates timeline for coordinated tween sequencing.
  - **Example:**
```js
const tl = gsap.timeline({ defaults:{ duration:0.3 } })
```
- **Signature:** `timeline.to/from/fromTo/set/add/call`
  - **What it does:** Chains timeline segments and callbacks.
  - **Example:**
```js
tl.to('.a',{x:40}).to('.b',{scale:1.2})
```
- **Signature:** `gsap.registerPlugin(...plugins)`
  - **What it does:** Registers plugin APIs like ScrollTrigger.
  - **Example:**
```js
gsap.registerPlugin(ScrollTrigger)
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

