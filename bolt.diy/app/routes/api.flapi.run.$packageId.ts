import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import type { FlapiRunResponse } from '~/types/flapi';

export async function action({ request, params }: ActionFunctionArgs) {
  const packageId = params.packageId;

  if (!packageId) {
    return json({ error: { code: 'validation_failed', message: 'Missing packageId' } }, { status: 400 });
  }

  const flapiUrl = process.env.FLAPI_URL || import.meta.env.VITE_FLAPI_URL;

  if (!flapiUrl) {
    return json(
      { error: { code: 'flapi_not_configured', message: 'FLAPI_URL is not configured' } },
      { status: 500 },
    );
  }

  let body: Record<string, unknown> = {};

  try {
    body = await request.json();
  } catch {
    // empty body is acceptable
  }

  try {
    const response = await fetch(`${flapiUrl}/package/${encodeURIComponent(packageId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return json(
        { error: { code: 'flapi_unavailable', message: `Flapi returned ${response.status}` } },
        { status: 502 },
      );
    }

    const data = (await response.json()) as FlapiRunResponse;
    return json(data);
  } catch (error) {
    console.error('Flapi run error:', error);
    return json(
      { error: { code: 'flapi_unavailable', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 502 },
    );
  }
}
