# Day.js (dayjs.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Dayjs />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Day.js is an immutable Moment-like date library.
- Core build is small; plugins extend parsing, timezone, duration, and relative-time behavior.
- Each operation returns a new instance, making state flows predictable.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.dayjs

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Now | `dayjs()` | Current timestamp wrapper |
| Format | `d.format('YYYY-MM-DD')` | String output |
| Manipulate | `d.add(1,'day')` | Returns new shifted date |
| Compare | `d1.isBefore(d2)` | Ordering checks |
| Plugin | `dayjs.extend(plugin)` | Activate addon API |

## Comprehensive options and additional API references
- **Signature:** `dayjs(input?: string|number|Date|Dayjs)`
  - **What it does:** Creates Day.js instance from supported input.
  - **Example:**
```js
const d = dayjs('2026-03-10')
```
- **Signature:** `dayjs().format(pattern?: string)`
  - **What it does:** Formats date using token pattern.
  - **Example:**
```js
dayjs().format('YYYY-MM-DD HH:mm')
```
- **Signature:** `dayjs().add(value: number, unit: string)`
  - **What it does:** Returns new instance offset by unit.
  - **Example:**
```js
const due = dayjs().add(30, 'day')
```
- **Signature:** `dayjs.extend(plugin)`
  - **What it does:** Registers plugin to add methods or behavior.
  - **Example:**
```js
dayjs.extend(window.dayjs_plugin_utc)
```
- **Signature:** `dayjs.utc(input)`
  - **What it does:** Creates UTC-based instance (with utc plugin).
  - **Example:**
```js
const t = dayjs.utc('2026-01-01T00:00:00Z')
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

