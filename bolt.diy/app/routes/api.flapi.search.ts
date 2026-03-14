import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { PackageDescriptor } from '~/types/flapi';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return json({ error: { code: 'validation_failed', message: 'Missing query parameter "q"' } }, { status: 400 });
  }

  const flapiUrl = process.env.FLAPI_URL || import.meta.env.VITE_FLAPI_URL;

  if (!flapiUrl) {
    return json(
      { error: { code: 'flapi_not_configured', message: 'FLAPI_URL is not configured' } },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${flapiUrl}/package/v1/search/${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return json(
        { error: { code: 'flapi_unavailable', message: `Flapi returned ${response.status}` } },
        { status: 502 },
      );
    }

    const data = await response.json();
    const packages = (Array.isArray(data) ? data : []) as PackageDescriptor[];
    const filtered = packages.filter((p) => p.Type === 'Package');

    return json(filtered);
  } catch (error) {
    console.error('Flapi search error:', error);
    return json(
      { error: { code: 'flapi_unavailable', message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 502 },
    );
  }
}
