# Axios (axios.js)

## Placeholder tag and where to put it
- Placeholder tag: `<Library:Axios />`
- Put it inside `<head>`.
- This placeholder injects this library's JavaScript assets.

## What this library does
- Axios is a promise-based HTTP client with request/response transforms and interceptors.
- It normalizes many edge cases of request config, errors, and JSON handling.
- Core workflow: create instance -> apply defaults/interceptors -> issue requests -> handle responses/errors.

## How it works internally (mental model)
- Parsing/initialization stage creates runtime objects, caches config, and wires events/state updates.
- Runtime operations mutate internal state models and trigger render/update pipelines.
- Performance-sensitive paths often include batching/diffing/caching, so prefer incremental updates over full recreation.
- Offline usage means all behavior comes from local dist files only; no CDN assumptions.

## Exported functionality
- axios callable
- axios.create
- interceptors
- request config system

## Cheat sheet
| Task | Signature/Pattern | What it does |
|---|---|---|
| Create client | `axios.create({ baseURL })` | Build isolated API client |
| GET request | `api.get('/users', { params })` | Fetch list/query data |
| POST JSON | `api.post('/users', body)` | Send payload |
| Intercept auth | `api.interceptors.request.use(fn)` | Inject token/header |
| Cancel request | `{ signal: controller.signal }` | Abort inflight call |

## Comprehensive options and additional API references
- **Signature:** `axios(config: AxiosRequestConfig)`
  - **What it does:** Performs request with full config object.
  - **Example:**
```js
axios({ method:'GET', url:'/users', params:{page:1} })
```
- **Signature:** `axios.create(defaults?: AxiosRequestConfig)`
  - **What it does:** Creates a new client instance with scoped defaults.
  - **Example:**
```js
const api = axios.create({ baseURL:'/api', timeout:10000 })
```
- **Signature:** `api.interceptors.request.use(onFulfilled, onRejected?, options?)`
  - **What it does:** Hooks request pipeline before network call.
  - **Example:**
```js
api.interceptors.request.use((c)=>({ ...c, headers:{...c.headers, 'X-Tenant':'acme'} }))
```
- **Signature:** `api.interceptors.response.use(onFulfilled, onRejected?)`
  - **What it does:** Hooks response pipeline for normalization/retry logic.
  - **Example:**
```js
api.interceptors.response.use(r=>r, e=>Promise.reject(e))
```
- **Signature:** `AxiosRequestConfig`
  - **What it does:** Options include baseURL, headers, params, data, timeout, withCredentials, responseType, validateStatus, signal.
  - **Example:**
```js
api.get('/export', { responseType:'blob', timeout:20000 })
```
- **Signature:** `axios.postForm(url, data, config?)`
  - **What it does:** Sends form-encoded/multipart-friendly payload in modern builds.
  - **Example:**
```js
axios.postForm('/upload', { file })
```
- **Signature:** `axios.isAxiosError(error)`
  - **What it does:** Type guard/helper for Axios-specific error shape.
  - **Example:**
```js
if (axios.isAxiosError(err)) console.log(err.response?.status)
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

