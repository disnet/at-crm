/**
 * Thin wrapper over the Bluesky chat XRPC endpoints. Calls go to the user's
 * PDS with the `atproto-proxy` header pointing at the bsky chat service —
 * the PDS forwards the DPoP-signed request to api.bsky.chat on the user's
 * behalf. Requires the `transition:chat.bsky` OAuth scope.
 */

import type { OAuthSession } from '@atproto/oauth-client-browser';

const CHAT_PROXY = 'did:web:api.bsky.chat#bsky_chat';

// Mirror listAllRecords' cap so a runaway pagination loop can't fan out.
const MAX_PAGES = 10;

export type ChatMember = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
};

export type ConvoView = {
  id: string;
  rev: string;
  members: ChatMember[];
  unreadCount?: number;
};

export type ChatMessageView = {
  $type?: string;
  id: string;
  rev: string;
  text: string;
  sender: { did: string };
  sentAt: string;
};

/** Thrown when the chat call fails because the OAuth session lacks
 *  `transition:chat.bsky` (existing pre-DM users). The page handles this by
 *  clearing the local session and routing to /login so the user can re-auth
 *  with the new scope. */
export class ChatScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatScopeError';
  }
}

type XrpcError = { error?: string; message?: string };

// Only treat a response as a scope error when the body actually says so —
// the chat XRPC also returns 403 for non-scope reasons (e.g. a single
// restricted/blocked convo). A blanket `status === 403 → scope error` would
// sign the user out mid-sync on any such convo, so we look at the error code
// and message instead. `status` is taken for completeness but isn't decisive.
function looksLikeScopeError(_status: number, body: XrpcError | null): boolean {
  const error = body?.error ?? '';
  const message = body?.message ?? '';
  if (/InvalidToken|InsufficientScope|ExpiredToken/i.test(error)) return true;
  if (/scope|chat\.bsky|transition:chat/i.test(message)) return true;
  return false;
}

async function chatGet<T>(
  session: OAuthSession,
  method: string,
  params: Record<string, string | undefined>,
  signal?: AbortSignal
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') qs.set(k, v);
  }
  const path = `/xrpc/${method}${qs.toString() ? `?${qs}` : ''}`;
  const res = await session.fetchHandler(path, {
    headers: { 'atproto-proxy': CHAT_PROXY },
    signal
  });
  if (!res.ok) {
    let body: XrpcError | null = null;
    try {
      body = (await res.json()) as XrpcError;
    } catch {
      // Non-JSON error body — fall through to generic error.
    }
    if (looksLikeScopeError(res.status, body)) {
      throw new ChatScopeError(
        body?.message ?? 'Bluesky chat scope is missing — please sign in again.'
      );
    }
    throw new Error(`${method} failed: ${res.status} ${body?.message ?? res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Yields every convo the user is part of, paging through `listConvos`. */
export async function* listConvos(
  session: OAuthSession,
  signal?: AbortSignal
): AsyncGenerator<ConvoView, void, void> {
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    if (signal?.aborted) return;
    const data = await chatGet<{ convos: ConvoView[]; cursor?: string }>(
      session,
      'chat.bsky.convo.listConvos',
      { limit: '100', cursor },
      signal
    );
    for (const c of data.convos ?? []) yield c;
    if (!data.cursor || (data.convos?.length ?? 0) === 0) return;
    cursor = data.cursor;
  }
}

/** Returns all messages in `convoId`, oldest-first, capped at MAX_PAGES * 100.
 *  The chat endpoint returns newest-first; we reverse so threads display
 *  chronologically. */
export async function listMessages(
  session: OAuthSession,
  convoId: string,
  signal?: AbortSignal
): Promise<ChatMessageView[]> {
  const out: ChatMessageView[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    if (signal?.aborted) break;
    const data = await chatGet<{ messages: ChatMessageView[]; cursor?: string }>(
      session,
      'chat.bsky.convo.getMessages',
      { convoId, limit: '100', cursor },
      signal
    );
    for (const m of data.messages ?? []) {
      // Filter out deleted/tombstoned messages — they share the union but
      // lack `text` and `sender`, which we depend on downstream.
      if (m && typeof m.text === 'string' && m.sender?.did) out.push(m);
    }
    if (!data.cursor || (data.messages?.length ?? 0) === 0) break;
    cursor = data.cursor;
  }
  out.reverse();
  return out;
}
