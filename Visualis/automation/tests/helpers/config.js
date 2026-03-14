const SERVER_BASE_URL = (process.env.SERVER_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const JUDGE_BASE_URL = (process.env.JUDGE_BASE_URL || "http://localhost:8010/v1").replace(/\/$/, "");
const JUDGE_BASE_URLS = (process.env.JUDGE_BASE_URLS || JUDGE_BASE_URL)
  .split(",")
  .map((item) => item.trim().replace(/\/$/, ""))
  .filter(Boolean);
const JUDGE_MODEL = process.env.JUDGE_MODEL || "Qwen/Qwen2.5-Coder-1.5B-Instruct";
const JUDGE_API_KEY = process.env.JUDGE_API_KEY || "";
const JUDGE_USER = process.env.JUDGE_USER || "";
const JUDGE_PASSWORD = process.env.JUDGE_PASSWORD || "";

export {
  SERVER_BASE_URL,
  JUDGE_BASE_URL,
  JUDGE_BASE_URLS,
  JUDGE_MODEL,
  JUDGE_API_KEY,
  JUDGE_USER,
  JUDGE_PASSWORD
};
