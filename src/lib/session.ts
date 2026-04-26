import type { OAuthSession } from '@atproto/oauth-client-browser';
import { getOAuthClient } from './oauth';

let sessionPromise: Promise<OAuthSession | null> | null = null;
let sessionDid: string | null = null;

export function resetSession(): void {
  sessionPromise = null;
  sessionDid = null;
}

/**
 * Restores the OAuth session for `did` from the browser-stored credentials.
 * Memoised per-DID so repeated callers (sync loops, refresh actions) share one
 * `OAuthSession` instance — the underlying DPoP fetch is stateful (nonces),
 * and we want all chat XRPCs against the same identity to share that state.
 */
export async function getSession(did: string): Promise<OAuthSession | null> {
  if (sessionPromise && sessionDid === did) return sessionPromise;
  sessionDid = did;
  sessionPromise = (async () => {
    try {
      const client = await getOAuthClient();
      return await client.restore(did);
    } catch (err) {
      console.warn('Failed to restore OAuth session', err);
      return null;
    }
  })();
  return sessionPromise;
}
