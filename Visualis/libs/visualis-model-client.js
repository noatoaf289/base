/*
 * Visualis Model Client
 * Browser helper for running prompt bundles through the Visualis server route.
 */
(function attachVisualisModelClient(globalScope) {
  "use strict";

  /**
   * Run a non-streaming model prompt through the Visualis backend.
   *
   * This helper is designed for HTML snippets running in an iframe and exposed as
   * `window.VisualisModelClient.runPromptWithModel`. It sends a single JSON body to
   * `POST /api/model/prompt`, waits for the full model response, and returns it.
   *
   * Why this exists:
   * - Keeps snippets independent from model endpoint details.
   * - Avoids exposing model credentials in snippet code.
   * - Provides one stable contract for both local and production environments.
   *
   * Payload contract:
   * - `userPrompt` (required): the user instruction.
   * - `systemPrompt` (optional): base behavioral system prompt.
   * - `structuredOutputPrompt` (optional): output-shape instructions.
   * - `restrictionsPrompt` (optional): hard constraints and safety restrictions.
   *
   * Security notes:
   * - Always send this request to your trusted Visualis backend (same-origin by default).
   * - Do not pass secrets in prompt fields.
   * - Validate or sanitize model output before injecting into HTML.
   *
   * @param {Object} input - Prompt segments passed to the model route.
   * @param {string} input.userPrompt - Required user instruction.
   * @param {string} [input.systemPrompt=""] - Optional system instruction.
   * @param {string} [input.structuredOutputPrompt=""] - Optional output schema prompt.
   * @param {string} [input.restrictionsPrompt=""] - Optional constraints prompt.
   * @param {Object} [options] - Optional request options.
   * @param {string} [options.endpoint="/api/model/prompt"] - Override backend endpoint.
   * @param {AbortSignal} [options.signal] - Optional abort signal for cancellation.
   * @returns {Promise<{response: string, modelResponse: unknown}>} Full server result.
   * @throws {TypeError} When required input is invalid.
   * @throws {Error} When HTTP request fails or server returns an error payload.
   *
   * @example
   * const result = await window.VisualisModelClient.runPromptWithModel({
   *   userPrompt: "Summarize the top 3 trends in the dataset",
   *   systemPrompt: "You are a concise analytics assistant.",
   *   structuredOutputPrompt: "Return JSON with keys: summary, trends.",
   *   restrictionsPrompt: "No markdown. No code fences."
   * });
   * console.log(result.response);
   */
  async function runPromptWithModel(input, options) {
    const payload = input || {};
    const requestOptions = options || {};
    const endpoint = requestOptions.endpoint || "/api/model/prompt";
    const userPrompt = typeof payload.userPrompt === "string" ? payload.userPrompt.trim() : "";

    if (!userPrompt) {
      throw new TypeError("userPrompt must be a non-empty string");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPrompt,
        systemPrompt: typeof payload.systemPrompt === "string" ? payload.systemPrompt : "",
        structuredOutputPrompt:
          typeof payload.structuredOutputPrompt === "string"
            ? payload.structuredOutputPrompt
            : "",
        restrictionsPrompt:
          typeof payload.restrictionsPrompt === "string" ? payload.restrictionsPrompt : "",
      }),
      signal: requestOptions.signal,
    });

    let body = null;
    try {
      body = await response.json();
    } catch (error) {
      throw new Error("Invalid JSON response from model route");
    }

    if (!response.ok) {
      const message =
        body &&
        typeof body === "object" &&
        body.error &&
        typeof body.error.message === "string"
          ? body.error.message
          : "Model prompt request failed";
      throw new Error(message);
    }

    return body;
  }

  globalScope.VisualisModelClient = {
    runPromptWithModel: runPromptWithModel,
  };
})(typeof window !== "undefined" ? window : globalThis);
