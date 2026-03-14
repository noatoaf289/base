# Leaflet (leaflet.js + leaflet.css)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Leaflet />`
- Put it inside `<head>`.
- This placeholder injects both CSS and JavaScript assets for Leaflet.

## What this library does
- Leaflet is a 2D interactive mapping library.
- It composes a map from base tile layers and overlay layers with evented interactions.
- The runtime uses projected coordinates and zoom levels to render map tiles efficiently.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- window.L

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Create map | `L.map(id, opts)` | Initialize map container |
| Base tiles | `L.tileLayer(url, opts)` | Attach map imagery |
| Marker | `L.marker(latlng, opts)` | Point annotation |
| GeoJSON | `L.geoJSON(data, opts)` | Render vector features |
| Fit bounds | `map.fitBounds(bounds)` | Viewport to content |

## Comprehensive options and additional API references
- **Signature:** `L.map(idOrElement, options?)`
  - **What it does:** Creates map instance with controls/interaction options.
  - **Example:**
```js
const map = L.map('m', { crs: L.CRS.EPSG4326, minZoom: 5, maxZoom: 19, center:[32.08,34.78], zoom:12 })
```
- **Signature:** `L.tileLayer(urlTemplate, options?)`
  - **What it does:** Creates tile source; options include attribution, maxZoom, opacity. Template must use `{z}`, `{x}`, `{y}` for XYZ tiles.
  - **Example:**
```js
// In this project, tile URL is provided at runtime: use window.mapUrl (XYZ format).
L.tileLayer(window.mapUrl, { minZoom:5, maxZoom:19 }).addTo(map)
```
  - **Project constraint:** When used here, map must use `L.CRS.EPSG4326`, `minZoom: 5`, `maxZoom: 19`, and tile URL from `window.mapUrl`.
- **Signature:** `L.marker(latlng, options?)`
  - **What it does:** Creates marker layer; options include draggable, icon, title.
  - **Example:**
```js
L.marker([32.08,34.78], { draggable:true }).addTo(map)
```
- **Signature:** `L.geoJSON(geojson, options?)`
  - **What it does:** Renders GeoJSON with style/filter/pointToLayer hooks.
  - **Example:**
```js
L.geoJSON(data, { style:{ color:'#2563eb' } }).addTo(map)
```
- **Signature:** `map.fitBounds(latLngBounds, options?)`
  - **What it does:** Zooms/pans map to include bounds.
  - **Example:**
```js
map.fitBounds(layer.getBounds(), { padding:[20,20] })
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
- The iframe will receive its cube data asynchronously via `postMessage` into `window.data`; **do not** initialize Leaflet maps or render anything that depends on the data until `window.data` is available.
- Wrap all Leaflet setup and rendering in an explicit initializer (for example `function initVisualization() { ... }`) that **reads from `window.data`** and is only invoked after `window.data` is populated.
- Assume a shared outer script will handle the `postMessage` listener and assignment into `window.data`; your snippet must simply **wait for `window.data`** (e.g. check if it exists and, if not, defer initialization) instead of running map logic at load time.

