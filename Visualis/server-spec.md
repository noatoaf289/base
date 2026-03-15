# Server Specification — Visualis

This document defines every route the server exposes, request/response shapes, and behavior. It is the single source of truth for the backend and for building mocks and the client.

**Base assumptions**
- Backend: single service (e.g. FastAPI) that serves the frontend, proxies to flapi and to the langchain agent, injects libs into generated HTML, and serves libs metadata/files as needed.
- All client requests go through this server (including flapi and agent).
- **Initial generate:** HTML snippet is stored in S3; reasoning summary (up to ~100k chars) is stored in Redis (TTL 12h).
- **Feedback loop:** Updated HTML snippet is stored in S3; reasoning summary remains in Redis (TTL 12h).
- Libs are read from the `libs/` filesystem; dist files are injected into snippets by the server.

---

## 1. Static & SPA

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the SPA entry (e.g. `index.html`). |
| GET | `/assets/*` | Static assets (JS, CSS, images) produced by the frontend build. |
| GET | `/*` (fallback) | SPA fallback: return `index.html` for non-file paths so client-side routing works. |

No JSON contract; these are static/file responses.

---

## 2. Config and models (client bootstrap)

### 2.0 GET /api/config

Returns public config used by the client for publish links and preview postMessage.

- **Method:** `GET`
- **Path:** `/api/config`
- **Response:** `200 OK` with body `{ "baseUrl": string, "iframeDataEvent": string }`.
  - `baseUrl`: server base URL (from env `BASE_URL`); used to build publish link `/api/snippets/:runId.html`.
  - `iframeDataEvent`: event name for postMessage data injection (from env `IFRAME_DATA_EVENT`).

### 2.0b GET /api/models

Returns list of available models for the generate/feedback model selector.

- **Method:** `GET`
- **Path:** `/api/models`
- **Response:** `200 OK` with body array of `{ "id": string, "name": string, "provider": string }`.
  - At least one entry: `id: "default"` (env MODEL_*). If MiniMax is configured (MINIMAX_BASE_URL + MINIMAX_API_KEY), a second entry `id: "minimax"` is included.

---

## 3. Flapi proxy

The server proxies to flapi so the client never talks to flapi directly.

### 3.1 Search packages (autocomplete)

This wraps flapi `GET /package/v1/search/<partial-package-id>` and is used for the package id autocomplete in the UI.

**Request**

- **Method:** `GET`
- **Path:** `/api/flapi/packages/search`
- **Query params:**
  - `q` (string, required) — partial package id or name fragment.

**Response**

- **Success:** `200 OK`
- **Body:** Array of package descriptors (forwarded from flapi, but filtered to `Type === "Package"`).

**Package descriptor (shape from flapi)**

| Field | Type | Description |
|-------|------|-------------|
| `Id` | number | Package id. |
| `Logo` | string | Base64 logo. |
| `Name` | string | Package name. |
| `Type` | string | Filtered so only `"Package"` is returned to the client. |

- **Proxy failure (e.g. flapi down):** `502 Bad Gateway` with optional JSON body `{ "error": { "code": "flapi_unavailable", "message": "..." } }`.
- **Validation:** `400 Bad Request` or `422 Unprocessable Entity` with body `{ "error": { "code": "...", "message": "..." } }`.

---

### 3.2 Run package

**Request**

- **Method:** `POST`
- **Path:** `/api/flapi/packages/:packageId/run`
- **Path params:** `packageId` (string) — package identifier.
- **Body:** JSON object — run parameters (arbitrary; forwarded as-is to flapi).
- **Headers:** Optional `Content-Type: application/json`.

**Response**

- **Success:** `200 OK`
- **Body:** Flapi response object. Must include at least:
  - `results`: `Record<string, unknown[]>` — key = cube name, value = array of result objects for that cube.
- **Proxy failure (e.g. flapi down):** `502 Bad Gateway` with optional JSON body `{ "error": { "code": "flapi_unavailable", "message": "..." } }`.
- **Validation (e.g. invalid packageId):** `400 Bad Request` or `422 Unprocessable Entity` with body `{ "error": { "code": "...", "message": "..." } }`.

**Example**

```http
POST /api/flapi/packages/my-pkg-123/run
Content-Type: application/json

{ "param1": "value1", "filters": {} }
```

```json
{
  "results": {
    "sales_cube": [ { "region": "North", "amount": 100 }, ... ],
    "users_cube": [ ... ]
  }
}
```

---

## 4. Libs

The server exposes lib metadata so the client/agent can know which libs exist and their type (for injection: js-only, js+css, css-only). Lib **content** is not exposed to the client; the server injects it into generated HTML.

### 4.1 List available libs

**Request**

- **Method:** `GET`
- **Path:** `/api/libs`

**Response**

- **Success:** `200 OK`
- **Body:** Array of lib descriptors.

**Lib descriptor (interface)**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable id (e.g. filename without extension: `"lodash"`, `"bootstrap"`). |
| `name` | string | Display name. |
| `type` | `"js"` \| `"css"` \| `"js-css"` | For injection: js-only, css-only, or both. |
| `files` | `{ js?: string, css?: string, wasm?: string }` | Keys present according to `type`; `wasm` is optional for runtimes that fetch a sidecar binary. Values are paths relative to libs root (e.g. `"lodash.js"`, `"bootstrap.css"`, `"sqlite3-wasm.wasm"`). |

**Example**

```json
[
  { "id": "lodash", "name": "Lodash", "type": "js", "files": { "js": "lodash.js" } },
  { "id": "bootstrap", "name": "Bootstrap", "type": "js-css", "files": { "js": "bootstrap.js", "css": "bootstrap.css" } },
  { "id": "normalize", "name": "Normalize.css", "type": "css", "files": { "css": "normalize.css" } }
]
```

### 4.2 Serve lib static files (optional)

If the generated snippet references lib files by URL (e.g. webfonts, or non-inlined assets), the server can serve them.

- **Method:** `GET`
- **Path:** `/libs/:path` (e.g. `/libs/font-awesome/webfonts/fa-solid-900.woff2`)
- **Response:** File content with appropriate `Content-Type`, or `404 Not Found`.

This is optional and only needed when snippets use external refs; primary model is inline injection.

---

## 5. Agent (Langchain) and snippet post-processing

The server calls the langchain agent (and optionally a vLLM/completions API). The agent returns HTML that may contain **library placeholder tags** (e.g. `<Library:Leaflet />`) and is expected to wait for external data injection. The server is responsible for:

- Replacing library placeholders using the **Library Injection Flow** (section 5).
- Injecting a data listener script using the **Data Injection Flow** (section 6).
- Storing the final, fully-injected HTML in S3 (initial + feedback), and the reasoning summary in Redis.

### 5.1 Generate HTML snippet (initial)

**Request**

- **Method:** `POST`
- **Path:** `/api/generate`
- **Body:** JSON.

**Request body (interface)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fieldExplanations` | `Array<{ fieldName: string, explanation: string }>` | Yes | Up to 16 items; user-provided field names and short explanations. |
| `userPrompt` | string | Yes | User’s natural-language prompt. |
| `mainCubeName` | string | Yes | Selected cube name (from package run results). |
| `mainCubeData` | `unknown[]` | Yes | Array of result objects for the main cube (injected as `window.data`). |
| `librariesUsed` | `string[]` | No | Reserved for future use (e.g. hint libs). |
| `modelId` | string | No | Model to use: `"default"` (env MODEL_*) or `"minimax"` when configured. Default `"default"`. |

**Response**

- **Success:** `200 OK`
- **Body:**

| Field | Type | Description |
|-------|------|-------------|
| `runId` | string | Opaque id for this generation run (used in feedback). Snippet is stored in S3 under this id. |
| `htmlSnippet` | string | Final HTML after Library Injection Flow and Data Injection Flow have been applied. Ready to render in iframe. |
| `librariesUsed` | string[] | Lib ids that were injected (e.g. `["chart-js", "lodash"]`). |

- **Agent/upstream error:** `502 Bad Gateway` or `503 Service Unavailable` with `{ "error": { "code": "...", "message": "..." } }`.
- **Validation (e.g. missing fields, >16 field explanations):** `400 Bad Request` or `422 Unprocessable Entity`.

**Example**

```http
POST /api/generate
Content-Type: application/json

{
  "fieldExplanations": [
    { "fieldName": "amount", "explanation": "Sale amount in USD" },
    { "fieldName": "region", "explanation": "Sales region name" }
  ],
  "userPrompt": "Show a bar chart of amount by region",
  "mainCubeName": "sales_cube",
  "mainCubeData": [ { "region": "North", "amount": 100 }, ... ]
}
```

```json
{
  "runId": "run_abc123",
  "htmlSnippet": "<!DOCTYPE html><html><head><script>/* ... */</script><style>/* ... */</style></head><body>...</body></html>",
  "librariesUsed": ["chart-js"]
}
```

### 5.2 Feedback loop (continuation)

**Request**

- **Method:** `POST`
- **Path:** `/api/feedback`
- **Body:** JSON.

**Request body (interface)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runId` | string | Yes | From the initial `/api/generate` response. |
| `feedback` | string | Yes | User’s continuation/correction prompt (e.g. “Make the bars blue”). |

**Response**

- **Success:** `200 OK`
- **Body:** Same as generate: `{ "runId": string, "htmlSnippet": string, "librariesUsed": string[] }`. `runId` unchanged. Server updates S3 with new snippet and Redis with updated summary **after re-applying Library Injection Flow and Data Injection Flow to the updated HTML**.
- **Not found (expired or invalid runId):** `404 Not Found` with `{ "error": { "code": "run_not_found", "message": "..." } }`.
- **Agent/upstream error:** `502` / `503` as above.
- **Validation:** `400` / `422` for missing or invalid body.

**Example**

```http
POST /api/feedback
Content-Type: application/json

{
  "runId": "run_abc123",
  "feedback": "Use blue for the bars and add a title"
}
```

### 5.3 Snippet model prompt execution (non-streaming)

Allows generated HTML snippets (via injected helper library) to run a prompt bundle against a server-managed OpenAI-compatible model endpoint without exposing model credentials inside snippet code.

**Request**

- **Method:** `POST`
- **Path:** `/api/model/prompt`
- **Body:** JSON.

**Request body (interface)**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userPrompt` | string | Yes | User instruction sent as the user role message. |
| `systemPrompt` | string | No | Base system instruction segment. |
| `structuredOutputPrompt` | string | No | Output-shape requirements merged into system prompt context. |
| `restrictionsPrompt` | string | No | Additional guardrails/constraints merged into system prompt context. |

**Behavior**

- Server composes a single non-streaming chat request and forwards it to `${PUBLIC_MODEL_URL}/chat/completions`.
- Route never streams; it waits for full model output and returns one JSON response.
- Uses `PUBLIC_MODEL_USER` and `PUBLIC_MODEL_PASSWORD` for optional upstream HTTP basic auth.
- If `PUBLIC_MODEL_URL` is not configured, server falls back to `MODEL_URL`.
- Intended default in local/dev can be the same model as agent; production can point to a simpler/cheaper model endpoint.

**Response**

- **Success:** `200 OK`
- **Body:** `{ "response": string, "modelResponse": object }`
  - `response`: extracted assistant text (best effort from first choice).
  - `modelResponse`: full raw upstream model response for advanced parsing.
- **Upstream failure:** `502 Bad Gateway` with `{ "error": { "code": "model_unavailable" | "model_error", "message": "...", "details"?: ... } }`.

### 5.4 Streaming reasoning (optional)

To support “agent’s reasoning and spinning circles”, the server may expose a streaming channel. Preferred: **SSE** or **Socket.IO** so the client can show incremental reasoning without blocking.

**Option A — SSE**

- **Method:** `GET`
- **Path:** `/api/generate/stream` (or same as generate with `Accept: text/event-stream` and POST with body).
- **Query or body:** Same inputs as `/api/generate` (e.g. pass a `requestId` and trigger generate via POST, then GET stream by `requestId`), or stream is tied to a single POST that returns both stream and final result.

**Option B — Socket.IO**

- **Event (client → server):** `generate` with payload same as `/api/generate` body.
- **Events (server → client):** `reasoning` (chunk or full message), `done` (final `{ runId, htmlSnippet, librariesUsed }`), `error`.

If not implemented in v1, the client can show a single spinner until the synchronous `POST /api/generate` or `POST /api/feedback` returns.

### 5.5 Serve persisted snippet HTML

To support iframe loading by URL, the server must expose a snippet retrieval route.

- **Method:** `GET`
- **Path:** `/api/snippets/:runId.html`
- **Behavior:**
  - Read directly from S3/object storage (`snippets/<runId>.html`).
- **Success:** `200 OK` with `Content-Type: text/html`.
- **Not found:** `404 Not Found` with `{ "error": { "code": "run_not_found", "message": "..." } }`.

---

## 6. Library Injection Flow (server behavior)

This section formalizes how the backend turns model-produced **placeholder tags** into real script/style/link tags using local dist files.

### 6.1 Placeholder tags

- The model is instructed to emit lightweight, non-visual placeholders in the HTML, for example:
  - `<Library:Leaflet />`
  - `<Library:ChartJS />`
  - `<Library:Lodash />`
- These placeholders **do not** have any visual effect; they are markers for the backend only.
- Each library’s `.md` file (in `libs/`) must document:
  - Which placeholder tag(s) to emit.
  - Where they should conceptually live (`<head>` or bottom of `<body>`).

### 6.2 Backend mapping dictionary

- The backend keeps an internal dictionary that maps placeholder tags to their final injection:

```ts
interface LibraryInjectionConfig {
  placeholder: string;           // e.g. "<Library:Leaflet />"
  location: "head" | "body-end"; // where to inject
  type: "js" | "css" | "js-css";
  files: { js?: string; css?: string }; // dist-relative paths, resolved against base URL
}
```

- Example entry for Leaflet (js+css):
  - `placeholder: "<Library:Leaflet />"`
  - `location: "head"`
  - `type: "js-css"`
  - `files: { js: "leaflet.js", css: "leaflet.css" }`

### 6.3 Injection algorithm (applied in `/api/generate` and `/api/feedback`)

1. Take the raw HTML returned by the agent (with placeholders).
2. Parse the HTML and locate each known placeholder tag.
3. For each match:
   - Remove the placeholder node.
   - Generate appropriate tags based on `type`:
     - **js-css:**
       - `<script src="{BASE_URL}/libs/{files.js}"></script>`
       - `<link rel="stylesheet" href="{BASE_URL}/libs/{files.css}" />`
     - **js only:**
       - `<script src="{BASE_URL}/libs/{files.js}"></script>`
     - **css only:**
       - `<link rel="stylesheet" href="{BASE_URL}/libs/{files.css}" />`
   - Insert generated tags into:
     - `<head>` when `location === "head"`.
     - Bottom of `<body>` when `location === "body-end"`.
4. Ensure tags are inserted **before** any closing `</head>` or `</body>` tag.
5. Track which library ids were actually injected and return them in `librariesUsed`.

Notes:

- `BASE_URL` is taken from environment (`BASE_URL` env var).
- Static file serving for `/libs/*` must match these paths so the iframe can load assets if needed.

---

## 7. Data Injection Flow (server behavior)

The snippet is rendered in an iframe in the host dashboard. Data for the selected cube is passed via `postMessage` from the host to the iframe, using a **configurable event name**.

### 7.1 Environment configuration

The backend reads the following environment variables (naming can be adjusted in implementation, but behavior must match):

- `BASE_URL` — current server URL; used for Library Injection Flow (script/link tags) and elsewhere.
- `IFRAME_DATA_EVENT` — string; the event name/type that the dashboard uses when posting data to the iframe.
- Flapi: URL (and any auth if required).
- Redis: URL with user, password, host, port.
- S3-compatible: URL, access key, private key (for storing initial generated HTML).
- Main model: URL, user, password (completions API).
- Secondary model: URL, user, password (optional).
- Leaflet tiles URL (for lib/config or injection when relevant).

### 7.2 Model responsibilities

The prompt the agent receives must instruct it to:

- Assume data will eventually be available at `window.data`.
- Structure its visualization code to:
  - Wait until `window.data` is populated.
  - React to changes in `window.data` (e.g. re-render on assignment).

The model **does not** need to implement the `postMessage` listener itself; that is added by the server.

### 7.3 Backend postMessage listener injection

After library injection (section 5), the backend must inject at the **end of the `<body>`** a script that:

1. Defines a global container for the cube data (e.g. `window.data`).
2. Listens for `message` events on `window`.
3. Filters messages using `IFRAME_DATA_EVENT` from env.
4. Assigns the payload to `window.data`.

Conceptually:

```html
<script>
  (function() {
    const eventName = "<IFRAME_DATA_EVENT>";
    window.data = null;
    window.addEventListener("message", function(event) {
      const message = event.data;
      if (!message || message.type !== eventName) {
        return;
      }
      window.data = message.payload;
    });
  })();
</script>
```

Rules:

- This script is injected automatically for **every** snippet returned by `/api/generate` and `/api/feedback`.
- The concrete implementation must read `IFRAME_DATA_EVENT` from env at runtime and replace `<IFRAME_DATA_EVENT>` accordingly.
- The same mechanism is used both:
  - When the iframe is embedded in the real dashboard.
  - When the client preview shows the snippet (preview must simulate the same `postMessage` flow).

---

## 8. Error response shape (all API routes)

Use a consistent JSON body for 4xx/5xx:

```ts
interface ErrorBody {
  error: {
    code: string;   // e.g. "validation_failed", "run_not_found", "flapi_unavailable"
    message: string;
    details?: unknown; // optional, e.g. Zod validation details
  };
}
```

- **400** — Bad request (malformed or invalid params).
- **404** — Resource not found (e.g. runId).
- **422** — Unprocessable Entity (semantic validation, e.g. schema).
- **502** — Bad Gateway (flapi or agent failed).
- **503** — Service Unavailable (e.g. agent overloaded); include `Retry-After` if applicable.

---

## 9. Data flow summary

1. **Client** → `GET /api/flapi/packages/search?q=...` → **Server** → flapi `/package/v1/search/<partial>` → **Server** filters `Type === "Package"` → **Client** (autocomplete results).
2. **Client** → `POST /api/flapi/packages/:packageId/run` with run params → **Server** → flapi → **Server** → **Client** (package run results).
3. Client derives cube names and main-cube data, user selects fields and explanations, enters prompt.
4. **Client** → `POST /api/generate` with fieldExplanations, userPrompt, mainCubeName, mainCubeData → **Server** → langchain agent → **Server**:
   - Applies Library Injection Flow (placeholder → script/link tags).
   - Applies Data Injection Flow (postMessage listener injection).
   - Stores final snippet in S3 and reasoning summary in Redis → **Client** (runId, htmlSnippet, librariesUsed).
5. (Optional) **Client** subscribes to streaming reasoning (SSE or Socket.IO) during step 4.
6. **Client** → `POST /api/feedback` with runId, feedback → **Server** calls langchain agent → **Server** re-applies injection flows, stores updated snippet in S3 and summary in Redis → **Client** (htmlSnippet, librariesUsed).
7. **Client** renders htmlSnippet in iframe; host dashboard sends cube data via `postMessage` using `IFRAME_DATA_EVENT`; the injected listener sets `window.data` so the snippet code can render. “Copy code” uses the same injected htmlSnippet; “Start over” reloads the app (no server call).
8. **Snippet runtime (optional)** → `POST /api/model/prompt` via injected `visualis-model-client` library with user/system/structured/restrictions prompts → **Server** forwards to public model endpoint (non-streaming) and returns full response payload.

---

## 10. Out of scope for this spec

- **Authentication/authorization** — not mentioned in README; add later if required.
- **Rate limiting** — recommended for `/api/generate` and `/api/feedback`; exact limits TBD.
- **CORS** — not needed if all requests are same-origin (frontend served by same server).
- **Exact Redis key layout** — implementation detail for agent summaries only; 12h TTL.

---

## 11. Checklist for mock and client

- [ ] Flapi mock: `GET /api/flapi/packages/search` and `POST /api/flapi/packages/:packageId/run` return stub data.
- [ ] Libs mock: `GET /api/libs` returns stub array of lib descriptors.
- [ ] Generate mock: `POST /api/generate` returns stub `runId`, minimal `htmlSnippet`, `librariesUsed`, and must already apply library + data injection logic (or simulate them).
- [ ] Feedback mock: `POST /api/feedback` returns stub snippet; optionally validate `runId` and return 404 when unknown; also simulate re-injection.
- [ ] Snippet serving mock: `GET /api/snippets/:runId.html` returns text/html for known run ids.
- [ ] Model mock exposes OpenAI-compatible `POST /v1/chat/completions` and `POST /v1/completions`.
- [ ] Client: multistep form (package search → package run → cube/fields → prompt → view/code/feedback) calling these routes only; no direct flapi or agent URLs.

---

## 12. Implementation missions (backend-focused)

To keep work manageable and parallelizable, implement the backend in the following missions:

1. **Mission A — Flapi proxy**
   - Implement `GET /api/flapi/packages/search`.
   - Implement `POST /api/flapi/packages/:packageId/run`.
   - Add robust error handling using the shared `ErrorBody` shape.
2. **Mission B — Libs metadata and static serving**
   - Implement `GET /api/libs`.
   - Implement `/libs/*` static serving compatible with Library Injection Flow.
3. **Mission C — Agent endpoints**
   - Implement `/api/generate` and `/api/feedback` wiring to the agent.
   - Integrate S3 for generated HTML (initial + feedback); Redis for reasoning summary only; 12h TTL for Redis keys.
4. **Mission D — Library Injection Flow**
   - Implement the placeholder → script/link injection pipeline as described in section 5.
   - Ensure `librariesUsed` reflects actual injections.
5. **Mission E — Data Injection Flow**
   - Implement env-driven postMessage listener injection as in section 6.
   - Ensure both dashboard iframe and preview use the same flow.
6. **Mission F — Streaming reasoning (optional)**
   - Add SSE or Socket.IO endpoints/events for streaming agent reasoning.
7. **Mission G — Mocks and tests**
   - Align `mocks/server.js` with this spec.
   - Provide integration tests for all routes and flows (including injection behaviors).
