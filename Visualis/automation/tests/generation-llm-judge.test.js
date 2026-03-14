import { beforeAll, describe, expect, it } from "vitest";
import { SERVER_BASE_URL } from "./helpers/config.js";
import { judgeGeneratedHtml } from "./helpers/judgeClient.js";
import { generateSnippet } from "./helpers/serverClient.js";

const assertGenerateSucceeded = ({ response, json, text }) => {
  expect(response.status, `Generate endpoint failed. Body: ${text}`).toBe(200);
  expect(typeof json?.runId).toBe("string");
  expect(typeof json?.htmlSnippet).toBe("string");
  return json.htmlSnippet;
};

const assertJudgePassed = (judgment) => {
  const details = JSON.stringify(judgment, null, 2);
  expect(judgment.securityIssues.length, `Security issues found:\n${details}`).toBe(0);
  expect(judgment.pass, `Judge rejected implementation:\n${details}`).toBe(true);
  expect(judgment.score, `Judge score too low:\n${details}`).toBeGreaterThanOrEqual(80);
};

describe("Visualis generation quality gates with LLM judge", () => {
  beforeAll(async () => {
    const response = await fetch(`${SERVER_BASE_URL}/api/libs`);
    expect(response.status).toBe(200);
  });

  it("builds a Bootstrap Tic-Tac-Toe game with complete gameplay flow", async () => {
    const prompt = [
      "Build a Tic-Tac-Toe game with Bootstrap styling.",
      "Include turn status and restart.",
      "Implement winner and draw logic.",
      "Avoid eval/new Function/document.write."
    ].join(" ");

    const generateResult = await generateSnippet({ userPrompt: prompt });
    const htmlSnippet = assertGenerateSucceeded(generateResult);

    const judgment = await judgeGeneratedHtml({
      scenarioName: "Bootstrap Tic-Tac-Toe",
      prompt,
      htmlSnippet,
      criteria: [
        "Uses Bootstrap classes or Bootstrap CDN/tag for visual styling",
        "Renders an interactive 3x3 game board",
        "Tracks X/O turns and updates the status text correctly",
        "Detects winner and draw states",
        "Includes a reset or new game control that clears the board",
        "UI appears production-like (structured layout, spacing, readable controls)",
        "No dangerous scripting patterns: eval, new Function, document.write, or obvious XSS sinks"
      ]
    });

    assertJudgePassed(judgment);
  });

  it("builds a dashboard-like UI with chart and data table behavior", async () => {
    const prompt = [
      "Create a responsive analytics UI with cards, chart, and table.",
      "Use window.data with empty fallback.",
      "Keep it in a single HTML snippet."
    ].join(" ");

    const generateResult = await generateSnippet({ userPrompt: prompt });
    const htmlSnippet = assertGenerateSucceeded(generateResult);

    const judgment = await judgeGeneratedHtml({
      scenarioName: "Graph and analytics UI",
      prompt,
      htmlSnippet,
      criteria: [
        "Contains chart rendering logic (for example canvas + chart initialization)",
        "Contains at least one data table in the UI",
        "Contains summary metrics/cards for high-level overview",
        "Reads and uses window.data for rendering",
        "Has empty-data fallback behavior instead of crashing",
        "Layout is responsive or mobile-friendly",
        "No dangerous scripting patterns: eval, new Function, document.write, or obvious XSS sinks"
      ]
    });

    assertJudgePassed(judgment);
  });
});
