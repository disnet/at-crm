import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

let clientPromise: Promise<BrowserOAuthClient> | null = null;

/**
 * Lazily construct the atproto OAuth client. Must be called from the browser.
 * - localhost / 127.0.0.1 dev: uses the loopback client_id with our Vite port
 *   as the redirect URI. The library will auto-redirect `localhost` → `127.0.0.1`
 *   so IndexedDB origins line up between auth start and callback.
 * - Production: expects a hosted `client-metadata.json` at the site root.
 */
export function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (!clientPromise) {
    const { origin, hostname, port, protocol } = window.location;
    const isLoopback =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

    let clientId: string;
    if (isLoopback) {
      const redirect = `http://127.0.0.1${port ? `:${port}` : ''}/login`;
      const params = new URLSearchParams({
        scope: 'atproto',
        redirect_uri: redirect
      });
      clientId = `http://localhost?${params.toString()}`;
    } else if (protocol !== 'https:') {
      throw new Error('atproto OAuth requires HTTPS outside of loopback dev.');
    } else {
      clientId = `${origin}/client-metadata.json`;
    }

    clientPromise = BrowserOAuthClient.load({
      clientId,
      handleResolver: 'https://bsky.social'
    });
  }
  return clientPromise;
}
