import { json } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
  // Precedence:
  //  1. PUBLIC_APP_ORIGIN — explicit override (e.g. to pin one canonical
  //     origin when several hostnames are bound to the same deployment).
  //  2. url.origin — the host the browser used to fetch this metadata.
  //     Bluesky's OAuth server fetches client-metadata.json via the same URL
  //     the browser passes as client_id, so url.origin necessarily matches
  //     the host the user is logging in from — preview hash, project alias,
  //     or future custom domain. Cloudflare's edge enforces Host against a
  //     bound hostname, so this can't be spoofed by a third party.
  const raw = publicEnv.PUBLIC_APP_ORIGIN || url.origin;
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
