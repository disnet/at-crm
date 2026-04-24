import { error, json } from '@sveltejs/kit';
import { building } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
  // Precedence:
  //  1. PUBLIC_APP_ORIGIN — explicit override for custom production domains.
  //  2. CF_PAGES_URL — Cloudflare Pages auto-exposes this at build time; it's
  //     the unique URL for this deployment (preview or *.pages.dev prod).
  const raw = publicEnv.PUBLIC_APP_ORIGIN || privateEnv.CF_PAGES_URL;
  if (!raw) {
    if (building) {
      throw new Error(
        'No origin configured. Set PUBLIC_APP_ORIGIN to your deployment URL ' +
          '(e.g. https://crm.example.com), or rely on CF_PAGES_URL on Cloudflare Pages.'
      );
    }
    // Dev server: this endpoint is unused (loopback handles local OAuth).
    error(404, 'client-metadata.json is only generated for production builds');
  }
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
