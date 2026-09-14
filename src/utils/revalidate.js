import { env } from '../config/env.js';

/**
 * Tells the Next.js app that cached data for these tags is stale.
 * Deliberately non-fatal: a content save must not fail because the web app is
 * down or restarting, so failures are logged and swallowed.
 */
export async function revalidate(tags) {
  if (!env.revalidateSecret) return;
  if (!tags?.length) return;

  try {
    const res = await fetch(`${env.webOrigin}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': env.revalidateSecret,
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn(`[revalidate] web app returned ${res.status} for tags: ${tags.join(', ')}`);
    }
  } catch (err) {
    console.warn(`[revalidate] could not reach the web app: ${err.message}`);
  }
}
