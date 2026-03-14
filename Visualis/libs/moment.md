# Moment.js (moment.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Moment />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Moment.js is a mutable date-time library with broad parsing/formatting/localization support.
- It models dates as objects with chainable manipulations and locale-aware display methods.
- Despite maintenance mode status, it remains common in legacy systems and offline bundles.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.moment

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Parse | `moment(str, fmt, strict)` | Create instance from text |
| Format | `m.format('YYYY-MM-DD')` | Render text |
| Manipulate | `m.clone().add(7,'day')` | Shift date safely |
| Relative | `m.fromNow()` | Humanized diff |
| Duration | `moment.duration(90,'minutes')` | Time span object |

## Comprehensive options and additional API references
- **Signature:** `moment(input?, format?, locale?, strict?)`
  - **What it does:** Parses input to a Moment instance.
  - **Example:**
```js
const m = moment('2026-03-10 09:30', 'YYYY-MM-DD HH:mm', true)
```
- **Signature:** `moment().format(formatString?)`
  - **What it does:** Formats instance using token string.
  - **Example:**
```js
moment().format('YYYY-MM-DD HH:mm:ss')
```
- **Signature:** `moment().add(amount, unit) / subtract(amount, unit)`
  - **What it does:** Mutates instance by adding/subtracting duration.
  - **Example:**
```js
const due = m.clone().add(30, 'days')
```
- **Signature:** `moment().isBefore/isAfter/isSame(other, unit?)`
  - **What it does:** Compares date ordering with optional granularity.
  - **Example:**
```js
if (m.isBefore(deadline, 'day')) console.log('early')
```
- **Signature:** `moment.duration(value, unit?)`
  - **What it does:** Creates duration object with conversion/humanize helpers.
  - **Example:**
```js
moment.duration(5400, 'seconds').asHours()
```
- **Signature:** `moment.utc(input?)`
  - **What it does:** Creates UTC moment independent of local offset.
  - **Example:**
```js
const utc = moment.utc('2026-03-10T12:00:00Z')
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

