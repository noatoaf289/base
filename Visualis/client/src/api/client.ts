import type {
  PackageDescriptor,
  FlapiRunResponse,
  LibDescriptor,
  GenerateRequest,
  GenerateResponse,
  FeedbackRequest,
  ErrorBody,
} from './schemas';

const API_BASE = '';

const parseJson = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
};

const ensureOk = async (res: Response): Promise<void> => {
  if (res.ok) return;
  const body = await parseJson<ErrorBody>(res).catch(() => ({ error: { code: 'unknown', message: res.statusText } }));
  const message = body?.error?.message ?? `HTTP ${res.status}`;
  console.error('[API]', res.status, message, body?.error?.code);
  throw new Error(message);
};

/** GET /api/flapi/packages/search?q= — package autocomplete (server-spec §2.1) */
export const searchPackages = async (query: string): Promise<PackageDescriptor[]> => {
  const q = encodeURIComponent(query.trim());
  const res = await fetch(`${API_BASE}/api/flapi/packages/search?q=${q}`);
  await ensureOk(res);
  return parseJson<PackageDescriptor[]>(res);
};

/** POST /api/flapi/packages/:packageId/run */
export const runPackage = async (
  packageId: string,
  runParams: Record<string, unknown>
): Promise<FlapiRunResponse> => {
  const res = await fetch(`${API_BASE}/api/flapi/packages/${encodeURIComponent(packageId)}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runParams),
  });
  await ensureOk(res);
  return parseJson<FlapiRunResponse>(res);
};

/** GET /api/libs */
export const listLibs = async (): Promise<LibDescriptor[]> => {
  const res = await fetch(`${API_BASE}/api/libs`);
  await ensureOk(res);
  return parseJson<LibDescriptor[]>(res);
};

/** POST /api/generate */
export const generateSnippet = async (body: GenerateRequest): Promise<GenerateResponse> => {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await ensureOk(res);
  return parseJson<GenerateResponse>(res);
};

/** POST /api/feedback */
export const sendFeedback = async (body: FeedbackRequest): Promise<GenerateResponse> => {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await ensureOk(res);
  return parseJson<GenerateResponse>(res);
};
