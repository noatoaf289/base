# Skeleton (skeleton.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Skeleton />`
- Put it inside `<head>`.
- This placeholder injects this library's CSS assets.

## What this library does
- Skeleton is a tiny CSS boilerplate with light grid/typography/forms defaults.
- It intentionally avoids a huge component catalog.
- It works best for minimal prototypes and low-overhead UI baselines.
- It is intended for really simple use cases and should not be mixed with other design libraries (pick Skeleton or another system, not both).

## How it works internally (mental model)
- CSS-only: no JavaScript runtime. The grid and components are purely class-based; include the stylesheet and use the documented class names.
- Offline usage: all behavior comes from the local CSS file only; no CDN assumptions.

## Exported functionality
- CSS classes only

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Grid | `.container .row .six.columns` | Simple responsive layout |
| Full width input | `.u-full-width` | Stretch control to parent |
| Primary button | `.button-primary` | Default emphasis button |
| Typographic baseline | `h1..h6 + body defaults` | Readable defaults |
| No runtime API | `N/A` | No JS constructors |

## Comprehensive options and additional API references
- **Signature:** `N/A (no JS API)`
  - **What it does:** Skeleton provides only CSS classes and base element styles.
  - **Example:**
```js
<link rel='stylesheet' href='./skeleton.css' />
```
- **Signature:** `Grid classes (version-dependent)`
  - **What it does:** Defines percentage-based columns and row composition.
  - **Example:**
```js
<div class='row'><div class='six columns'>A</div></div>
```
- **Signature:** `.u-full-width`
  - **What it does:** Utility class that stretches form control to parent width.
  - **Example:**
```js
<input class='u-full-width' />
```
- **Signature:** `.button-primary`
  - **What it does:** Primary visual variant for action button.
  - **Example:**
```js
<button class='button-primary'>Save</button>
```
- **Signature:** `Override pattern`
  - **What it does:** Add custom stylesheet after Skeleton to define brand system.
  - **Example:**
```js
<link rel='stylesheet' href='./custom.css' />
```

## Class reference for offline models

- **Grid and layout**
  - **`.container`**: Centers page content with a max-width of 960px, horizontal padding, and responsive width (100% → 85% → 80% at larger breakpoints).
  - **`.column`, `.columns`**: Fluid grid columns that float left and take 100% width on small screens; at ≥550px they gain left margins and width-based column modifiers.
  - **`.one.column` … `.twelve.columns`**: Fixed-width fractions of the grid (`.one` ≈ 1/12, `.six` ≈ 1/2, `.twelve` = full width). Use inside `.container` and `.row` to build responsive columns.
  - **`.one-third.column`, `.two-thirds.column`**: 1/3 and 2/3 width columns for simple two-column layouts.
  - **`.one-half.column`**: 1/2 width column for symmetric split layouts.
  - **Offset classes** (`.offset-by-one.column` … `.offset-by-eleven.columns`, `.offset-by-one-third.column`, `.offset-by-two-thirds.columns`, `.offset-by-one-half.column`): Add left margin to push a column to the right by a grid fraction; use in combination with a `.column`/`.columns` width class.
  - **`.row`**: Logical wrapper for groups of columns; combined with `.row:after` it participates in the clearfix that keeps rows from collapsing around floated children.

- **Typography and base**
  - **`body` (implicit)**: Uses `Raleway`/system sans fonts, 1.5em base font size, and neutral body text color `#222`.
  - **`h1`–`h6` (implicit)**: Light-weight headings with decreasing font sizes and tuned letter-spacing; responsive sizes increase on screens ≥550px.
  - **`p`, `ul`, `ol`, `table`, `blockquote`, `pre`, `form`, etc. (implicit)**: Predefined bottom margins to create consistent vertical rhythm.

- **Links and text**
  - **`a` (implicit)**: Primary link color `#1EAEDB`; hover color darkens to `#0FA0CE`.
  - **`code`, `pre > code`**: Inline code gets grey background, border, and rounded corners; block code expands to full-width blocks with padding and `white-space: pre`.

- **Buttons**
  - **`.button` + `button`, `input[type="submit"|"reset"|"button"]`**: Standard button look—38px height, horizontal padding, uppercase small text, border, and subtle grey color.
  - **`.button.button-primary` (and `.button-primary` on `button`/`input`)**: Primary action styling with white text, cyan background `#33C3F0`, and matching border; hover/focus darkens to `#1EAEDB`.

- **Forms**
  - **Text inputs** (`input[type="email|number|search|text|tel|url|password"]`, `textarea`, `select`): 38px high fields with padding, white background, light grey border, and rounded corners; blue border `#33C3F0` on focus.
  - **`textarea`**: Minimum height of 65px with symmetric vertical padding.
  - **`label`, `legend`**: Block elements with bottom margin and bold weight for clear form labeling.
  - **`input[type="checkbox|radio"]`**: Displayed inline so they sit on the same line as text.
  - **`.label-body`**: Helper span inside labels that adds left margin and normal font weight, used for label text following a checkbox/radio.

- **Lists and tables**
  - **`ul`, `ol`**: Use `circle` (unordered) or `decimal` (ordered) markers placed inside; nested lists reduce font size and add left margin.
  - **`th`, `td`**: Uniform cell padding and a light bottom border; first and last cells remove side padding so tables align with surrounding content.

- **Spacing helpers**
  - **`.button`, `button`**: Buttons have a default bottom margin to separate stacked actions.
  - **Inputs, `textarea`, `select`, `fieldset`**: Extra bottom margin to separate form controls vertically.

- **Utilities**
  - **`.u-full-width`**: Forces an element (typically an input, image, or block) to take 100% of its parent width with `box-sizing: border-box`.
  - **`.u-max-full-width`**: Constrains an element’s width to at most 100% of its parent while preserving natural intrinsic width when smaller.
  - **`.u-pull-right`**: Floats an element to the right (e.g., for right-aligned buttons or badges).
  - **`.u-pull-left`**: Floats an element to the left.

- **Clearing and misc**
  - **`.u-cf`**: Clearfix utility; applies a pseudo-element to clear floats inside the element. Use on containers that wrap floated children.
  - **`.container:after`, `.row:after`**: Built-in clearfix applied automatically to `.container` and `.row` so columns don’t overflow their parent.
  - **`hr`**: Horizontal rule with generous vertical margins and a light grey border, used as a section divider.

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
- Skeleton is CSS-only; any JavaScript you generate that uses these styles must **wait for `window.data`** (populated asynchronously via `postMessage`) before driving data-dependent DOM updates.
- Encapsulate layout/render logic that reads cube data into an initializer (for example `function initVisualization() { const rows = window.data || []; /* build DOM using Skeleton classes */ }`) and invoke it only after `window.data` is available.
- Rely on a shared outer listener that assigns into `window.data`; your snippet should not add its own `postMessage` listener and must avoid running data-driven rendering at initial load.

