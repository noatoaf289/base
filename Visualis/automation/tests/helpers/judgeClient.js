import {
  JUDGE_API_KEY,
  JUDGE_BASE_URLS,
  JUDGE_MODEL,
  JUDGE_PASSWORD,
  JUDGE_USER
} from "./config.js";
import { buildAuthHeaders, postJson } from "./http.js";

const extractJsonObject = (rawText) => {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const stringifyCriteria = (criteria) => criteria.map((item, index) => `${index + 1}. ${item}`).join("\n");

const judgeGeneratedHtml = async ({ scenarioName, prompt, htmlSnippet, criteria }) => {
  const rubric = stringifyCriteria(criteria);
  const systemPrompt = [
    "You are a strict software QA judge.",
    "Evaluate whether the HTML/CSS/JS implementation satisfies ALL criteria.",
    "Be strict about missing functionality and security concerns.",
    "Return valid JSON only with this exact schema:",
    '{"pass": boolean, "score": number, "missingCriteria": string[], "securityIssues": string[], "notes": string[]}'
  ].join("\n");

  const userPrompt = [
    `Scenario: ${scenarioName}`,
    "Original request prompt:",
    prompt,
    "",
    "Acceptance criteria:",
    rubric,
    "",
    "Generated HTML snippet to evaluate:",
    htmlSnippet
  ].join("\n");

  const headers = buildAuthHeaders({
    apiKey: JUDGE_API_KEY,
    user: JUDGE_USER,
    password: JUDGE_PASSWORD
  });

  let lastError = "";
  let payload = null;
  for (const baseUrl of JUDGE_BASE_URLS) {
    const { response, json, text } = await postJson({
      url: `${baseUrl}/chat/completions`,
      headers,
      body: {
        model: JUDGE_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }
    });

    if (response.ok) {
      payload = json;
      break;
    }

    lastError = `Judge endpoint ${baseUrl} failed (${response.status}): ${text}`;
  }

  if (!payload) {
    throw new Error(lastError || "Judge model call failed for all configured endpoints.");
  }

  const content = payload?.choices?.[0]?.message?.content ?? "";
  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error(`Judge model returned non-JSON output: ${content}`);
  }

  return {
    pass: Boolean(parsed.pass),
    score: Number(parsed.score || 0),
    missingCriteria: Array.isArray(parsed.missingCriteria) ? parsed.missingCriteria : [],
    securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    rawJudgeResponse: content
  };
};

export { judgeGeneratedHtml };
