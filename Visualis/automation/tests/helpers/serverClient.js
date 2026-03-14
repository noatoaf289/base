import { SERVER_BASE_URL } from "./config.js";
import { postJson } from "./http.js";

const sampleCubeRows = [
  { p: "A", pts: 12, s: "w" }
];

const defaultFieldExplanations = [
  { fieldName: "pts", explanation: "score" }
];

const buildGenerateBody = ({ userPrompt, rows = sampleCubeRows, fieldExplanations = defaultFieldExplanations }) => ({
  fieldExplanations,
  userPrompt,
  mainCubeName: "game_results",
  mainCubeData: rows
});

const generateSnippet = async ({ userPrompt, rows, fieldExplanations }) => {
  const body = buildGenerateBody({ userPrompt, rows, fieldExplanations });
  return postJson({
    url: `${SERVER_BASE_URL}/api/generate`,
    body
  });
};

export { generateSnippet, sampleCubeRows };
