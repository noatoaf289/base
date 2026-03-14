# Visualis Model Client

Use this library when an HTML snippet needs to run prompts through the server-managed model route without directly calling model infrastructure.

## Placeholder Tag

Insert this placeholder in your HTML snippet `<head>`:

```html
<Library:VisualisModelClient />
```

## What It Exposes

After injection, this global is available:

- `window.VisualisModelClient.runPromptWithModel(input, options)`

It calls `POST /api/model/prompt` with a non-streaming request and returns the full JSON result.

## Input Shape

```js
{
  userPrompt: string,                 // required
  systemPrompt?: string,              // optional
  structuredOutputPrompt?: string,    // optional
  restrictionsPrompt?: string         // optional
}
```

Optional second argument:

```js
{
  endpoint?: "/api/model/prompt",     // override only if needed
  signal?: AbortSignal
}
```

## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <Library:VisualisModelClient />
  </head>
  <body>
    <pre id="out">waiting...</pre>
    <script>
      (async () => {
        const result = await window.VisualisModelClient.runPromptWithModel({
          userPrompt: "Summarize this data briefly",
          systemPrompt: "You are a concise analytics assistant",
          structuredOutputPrompt: "Return JSON with keys summary and confidence",
          restrictionsPrompt: "No markdown, no code fences"
        });

        document.getElementById("out").textContent = result.response;
      })();
    </script>
  </body>
</html>
```

## Security and Reliability Notes

- Never put secrets in prompt fields.
- Treat model output as untrusted input and sanitize before injecting into DOM.
- Keep prompts focused and bounded to reduce abuse and latency.
- Use server-side auth and routing (`PUBLIC_MODEL_URL`, `PUBLIC_MODEL_USER`, `PUBLIC_MODEL_PASSWORD`) instead of direct browser credentials.
