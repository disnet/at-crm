import { json } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
  // Precedence:
  //  1. PUBLIC_APP_ORIGIN — explicit override for custom production domains.
  //  2. CF_PAGES_URL — Cloudflare Pages auto-exposes this to Pages Functions
  //     at runtime; it's the unique URL for this deployment.
  //  3. url.origin — final fallback for preview deploys without either env var.
  const raw = publicEnv.PUBLIC_APP_ORIGIN || privateEnv.CF_PAGES_URL || url.origin;
  const origin = raw.replace(/\/+$/, '');
  if (!/^https:\/\//.test(origin)) {
    throw new Error(`Origin must be an https:// URL, got "${raw}"`);
  }

  return json({
    client_id: `${origin}/client-metadata.json`,
    client_name: 'Personal CRM',
    client_uri: origin,
    redirect_uris: [`${origin}/login`],
    scope: 'atproto',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true
  });
};
