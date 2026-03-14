# normalize.css (normalize.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Normalize />`
- Put it inside `<head>`.
- This placeholder injects this library's CSS assets.

## What this library does
- normalize.css aligns browser default styles while preserving useful native behavior.
- It is a baseline stylesheet, not a component system or utility framework.
- Its effect is entirely declarative CSS with no runtime API.

## How it works internally (mental model)
- This is CSS only: no JavaScript runtime or API. The browser applies the stylesheet rules at load; no initialization or state.
- Offline usage: include the local CSS file first; all behavior comes from that file only; no CDN assumptions.

## Exported functionality
- CSS normalization rules only

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Global baseline | `link normalize.css first` | Create stable defaults |
| Forms | `normalized input/button behavior` | Reduce browser variance |
| Typography | `consistent heading/body defaults` | Predictable text rendering |
| Media | `img/svg default fixes` | Safer embedded content |
| No JS | `N/A` | No runtime functions |

## Comprehensive options and additional API references
- **Signature:** `N/A (no JavaScript API)`
  - **What it does:** normalize.css exports CSS rules, not callable functions.
  - **Example:**
```js
<link rel='stylesheet' href='./normalize.css' />
```
- **Signature:** `Rule area: form controls`
  - **What it does:** Normalizes button/input/select rendering and inheritance quirks.
  - **Example:**
```js
input, button { font: inherit; }
```
- **Signature:** `Rule area: text semantics`
  - **What it does:** Aligns elements like h1/hr/pre/sub/sup across browsers.
  - **Example:**
```js
hr { box-sizing: content-box; }
```
- **Signature:** `Rule area: embedded media`
  - **What it does:** Improves defaults for img/svg/audio/video display behavior.
  - **Example:**
```js
img { border-style: none; }
```
- **Signature:** `Override strategy`
  - **What it does:** Place custom stylesheet after normalize.css for project-specific tokens/components.
  - **Example:**
```js
<link rel='stylesheet' href='./app.css' />
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

