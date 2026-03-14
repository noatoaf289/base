# Bulma (bulma.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Bulma />`
- Put it inside `<head>`.
- This placeholder injects this library's CSS assets.

## What this library does
- Bulma is a CSS-only flexbox framework.
- Behavior is expressed by class modifiers instead of JavaScript constructors.
- It is ideal for clean, semantic HTML with minimal custom scripting.

## How it works internally (mental model)
- CSS-only: no JavaScript. Layout and appearance are driven by class names; state (e.g. modal open) is toggled by adding/removing classes (e.g. `is-active`) via your own script or framework.
- Offline usage: all behavior comes from the local CSS file only; no CDN assumptions.

## Exported functionality
- Bulma class system
- is-* and has-* modifiers

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Columns | `.columns / .column is-half` | Responsive flex columns |
| Buttons | `.button is-primary is-loading` | Stateful button styles |
| Forms | `.field .control .input` | Form layout primitives |
| Navbar | `.navbar + is-active` | Responsive nav pattern |
| Modal | `.modal.is-active` | Visibility via class toggle |

## Comprehensive options and additional API references
- **Signature:** `Column options: .columns.is-mobile / .is-multiline / .is-gapless`
  - **What it does:** Controls layout flow and spacing.
  - **Example:**
```js
<div class='columns is-multiline is-gapless'></div>
```
- **Signature:** `Width modifiers: .column.is-half | .is-one-third | .is-3`
  - **What it does:** Assigns column proportions by fraction or 12-grid count.
  - **Example:**
```js
<div class='column is-one-third'>A</div>
```
- **Signature:** `Form modifiers: .input.is-rounded.is-danger`
  - **What it does:** Adjusts style and validation-state semantics.
  - **Example:**
```js
<input class='input is-rounded is-danger' />
```
- **Signature:** `Button modifiers: .button.is-primary.is-outlined.is-small`
  - **What it does:** Composes color/shape/size behavior.
  - **Example:**
```js
<button class='button is-primary is-outlined is-small'>Run</button>
```
- **Signature:** `State toggles: .is-active on modal/navbar/dropdown/tabs`
  - **What it does:** Drives interactive visibility/selection state.
  - **Example:**
```js
modal.classList.add('is-active')
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

