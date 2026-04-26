import Dexie, { type Table } from 'dexie';
import type { OAuthSession } from '@atproto/oauth-client-browser';
import {
  formatAddress,
  isMessage,
  type AtmoSource,
  type Contact,
  type Message,
  type NoteEntry,
  type SourceKey
} from './data';
import { fetchSifaProfile, getProfile, type ActorTypeahead } from './atproto';
import { findAtmosphereMutuals, mapWithLimit } from './atmo';
import {
  ChatScopeError,
  listConvos,
  listMessages,
  type ChatMember,
  type ChatMessageView,
  type ConvoView
} from './bskyChat';

/**
 * Per-convo sync bookmark. We store the convo's `rev` from listConvos so the
 * next sync can short-circuit unchanged threads, and the contact id so a
 * per-contact refresh action can map back to its convo without rescanning.
 */
export type ConvoSyncRecord = {
  convoId: string;
  contactId: string;
  rev: string;
};

class CrmDB extends Dexie {
  contacts!: Table<Contact, string>;
  convos!: Table<ConvoSyncRecord, string>;

  constructor() {
    super('crm');
    this.version(1).stores({ contacts: 'id, order' });
    // v2 reshaped Contact (drops mock seed + adds sifa). Old rows were stale — cleared.
    this.version(2)
      .stores({ contacts: 'id, order' })
      .upgrade((tx) => tx.table('contacts').clear());
    // v3 adds mutualSources / discoveredVia. Existing rows backfill in place
    // — they were added manually, so default discoveredVia to 'manual'.
    this.version(3)
      .stores({ contacts: 'id, order' })
      .upgrade((tx) =>
        tx
          .table('contacts')
          .toCollection()
          .modify((c: Contact) => {
            if (!Array.isArray(c.mutualSources)) c.mutualSources = [];
            if (!c.discoveredVia) c.discoveredVia = 'manual';
          })
      );
    // v4 adds the convos sync table — per-convo `rev` cursor lets repeated
    // syncs skip threads that haven't moved since last fetch.
    this.version(4).stores({ contacts: 'id, order', convos: 'convoId, contactId' });
  }
}

export const db = new CrmDB();

const ATMO_SYNC_KEY_PREFIX = 'crm_atmoSyncedAt';
const ATMO_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h

// Scoped per-DID so signing into a different account triggers a fresh sync
// even within the throttle window — the previous user's contacts stay in
// IndexedDB and would otherwise mask the new user's mutuals.
function atmoSyncKey(did: string): string {
  return `${ATMO_SYNC_KEY_PREFIX}:${did}`;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColorForDid(did: string): string {
  let h = 0;
  for (let i = 0; i < did.length; i++) h = (h * 31 + did.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `oklch(68% 0.13 ${hue})`;
}

export type AddContactOpts = {
  handleHint?: string;
  avatarHint?: string;
  displayNameHint?: string;
  mutualSources?: AtmoSource[];
  discoveredVia?: 'manual' | 'mutual';
  signal?: AbortSignal;
};

export async function addContactFromDid(did: string, opts: AddContactOpts = {}): Promise<Contact> {
  const existing = await db.contacts.get(did);
  if (existing) return existing;

  const [profile, sifa] = await Promise.all([
    getProfile(did, opts.signal).catch(() => null),
    fetchSifaProfile(did, opts.signal).catch(() => null)
  ]);

  const handle = profile?.handle ?? opts.handleHint ?? did;
  const name = profile?.displayName?.trim() || opts.displayNameHint?.trim() || handle;

  const primaryPosition =
    sifa?.positions.find((p) => p.isPrimary && !p.endedAt) ??
    sifa?.positions.find((p) => !p.endedAt) ??
    sifa?.positions[0] ??
    null;

  const tagline =
    sifa?.self?.headline?.trim() ||
    (primaryPosition ? `${primaryPosition.title} · ${primaryPosition.company}` : '') ||
    profile?.description?.split('\n')[0]?.trim() ||
    `@${handle}`;

  const primaryExternal =
    sifa?.externalAccounts.find((e) => e.isPrimary) ?? sifa?.externalAccounts[0] ?? null;

  const url = primaryExternal?.url || `https://bsky.app/profile/${handle}`;

  const last = await db.contacts.orderBy('order').last();
  const order = (last?.order ?? 0) + 1;

  const contact: Contact = {
    id: did,
    order,
    did,
    handle,
    name,
    initials: initialsFrom(name),
    avatarColor: avatarColorForDid(did),
    avatarUrl: profile?.avatar ?? opts.avatarHint,
    bio: profile?.description?.trim() || undefined,
    tagline,
    location: formatAddress(sifa?.self?.location),
    url,
    sources: ['bluesky'],
    lastMsg: `@${handle}`,
    lastActive: 'Just added',
    unread: 0,
    reminder: null,
    threads: { bluesky: [] },
    sifa,
    mutualSources: opts.mutualSources ? [...opts.mutualSources] : [],
    discoveredVia: opts.discoveredVia ?? 'manual'
  };

  await db.contacts.put(contact);
  return contact;
}

export async function addContactFromBluesky(actor: ActorTypeahead): Promise<Contact> {
  return addContactFromDid(actor.did, {
    handleHint: actor.handle,
    avatarHint: actor.avatar,
    displayNameHint: actor.displayName,
    discoveredVia: 'manual'
  });
}

function mergeAtmoSources(prev: AtmoSource[] | undefined, incoming: AtmoSource[]): AtmoSource[] {
  const order: AtmoSource[] = ['bluesky', 'sifa', 'tangled'];
  const set = new Set<AtmoSource>(prev ?? []);
  for (const s of incoming) set.add(s);
  return order.filter((s) => set.has(s));
}

function sameAtmoSources(a: AtmoSource[], b: AtmoSource[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export type AtmoSyncResult = {
  added: number;
  annotated: number;
  total: number;
  /** Platforms whose follow lists we couldn't exhaustively fetch — there are
   *  likely additional mutuals beyond what was synced. */
  truncated: Partial<Record<AtmoSource, boolean>>;
};

const MUTUAL_SEED_CONCURRENCY = 6;
const MUTUAL_HYDRATE_CONCURRENCY = 4;

/**
 * Seeds a Contact for a mutual using only the public Bluesky profile, deferring
 * the much-heavier Sifa fan-out (PDS resolve + ~7 listRecords) to a follow-up
 * pass. Lets the sync UI clear quickly even when the user has hundreds of
 * mutuals; Sifa data fills in lazily.
 */
async function seedMutualContact(
  did: string,
  sources: AtmoSource[],
  signal?: AbortSignal
): Promise<boolean> {
  if (signal?.aborted) return false;
  const existing = await db.contacts.get(did);
  if (existing) return false;

  const profile = await getProfile(did, signal).catch(() => null);
  if (signal?.aborted) return false;

  const handle = profile?.handle ?? did;
  const name = profile?.displayName?.trim() || handle;
  const tagline = profile?.description?.split('\n')[0]?.trim() || `@${handle}`;

  const last = await db.contacts.orderBy('order').last();
  const order = (last?.order ?? 0) + 1;

  const contact: Contact = {
    id: did,
    order,
    did,
    handle,
    name,
    initials: initialsFrom(name),
    avatarColor: avatarColorForDid(did),
    avatarUrl: profile?.avatar,
    bio: profile?.description?.trim() || undefined,
    tagline,
    location: undefined,
    url: `https://bsky.app/profile/${handle}`,
    sources: ['bluesky'],
    lastMsg: `@${handle}`,
    lastActive: 'Just added',
    unread: 0,
    reminder: null,
    threads: { bluesky: [] },
    sifa: null,
    mutualSources: [...sources],
    discoveredVia: 'mutual'
  };

  await db.contacts.put(contact);
  return true;
}

/**
 * Discovers atmosphere mutuals for the signed-in user and seeds them as
 * contacts (or annotates existing contacts with their mutual sources).
 * Existing manual contacts keep `discoveredVia: 'manual'` — they just gain
 * platform tags. Throttled to once per `ATMO_SYNC_INTERVAL_MS` per browser.
 */
export async function syncAtmosphereMutuals(
  user: { did: string },
  opts: { force?: boolean; signal?: AbortSignal } = {}
): Promise<AtmoSyncResult> {
  const { signal } = opts;
  const syncKey = atmoSyncKey(user.did);
  if (!opts.force) {
    try {
      const last = Number(localStorage.getItem(syncKey) ?? '0');
      if (last && Date.now() - last < ATMO_SYNC_INTERVAL_MS) {
        return { added: 0, annotated: 0, total: 0, truncated: {} };
      }
    } catch {
      // localStorage unavailable — proceed anyway.
    }
  }

  const { mutuals, truncated } = await findAtmosphereMutuals(user, signal);
  if (signal?.aborted) return { added: 0, annotated: 0, total: 0, truncated };

  // Annotate existing contacts up front (cheap — local DB only).
  let annotated = 0;
  const toSeed: Array<{ did: string; sources: AtmoSource[] }> = [];
  for (const [did, sources] of mutuals) {
    if (signal?.aborted) return { added: 0, annotated, total: mutuals.size, truncated };
    const existing = await db.contacts.get(did);
    if (existing) {
      const merged = mergeAtmoSources(existing.mutualSources, sources);
      if (!sameAtmoSources(existing.mutualSources ?? [], merged)) {
        await db.contacts.update(did, { mutualSources: merged });
        annotated++;
      }
    } else {
      toSeed.push({ did, sources });
    }
  }

  // Seed minimal contacts in parallel — one Bluesky profile call each, no Sifa
  // yet. Concurrency-limited so we don't hammer the appview.
  const seeded = await mapWithLimit(toSeed, MUTUAL_SEED_CONCURRENCY, ({ did, sources }) =>
    seedMutualContact(did, sources, signal).catch(() => false)
  );
  const added = seeded.filter(Boolean).length;
  if (signal?.aborted) return { added, annotated, total: mutuals.size, truncated };

  // Hydrate Sifa for newly-seeded contacts in the background. Fire-and-forget
  // so the sync pill clears as soon as the basic profiles land; Sifa pickups
  // ride on the same liveQuery into the UI when each row's update commits.
  const seededDids = toSeed.filter((_, i) => seeded[i]).map((m) => m.did);
  void mapWithLimit(seededDids, MUTUAL_HYDRATE_CONCURRENCY, (did) =>
    refreshSifa(did, signal).catch(() => undefined)
  );

  // If the caller bailed mid-flight, don't stamp the throttle — we want the
  // next mount to retry rather than skip-because-already-synced.
  if (!signal?.aborted) {
    try {
      localStorage.setItem(syncKey, String(Date.now()));
    } catch {
      // localStorage unavailable — the next run will just re-sync.
    }
  }

  return { added, annotated, total: mutuals.size, truncated };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowTs(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function previewOf(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 80 ? t.slice(0, 77) + '…' : t;
}

async function appendToThread(
  contactId: string,
  source: SourceKey,
  entry: Message | NoteEntry,
  lastMsgPreview: string
): Promise<void> {
  const existing = await db.contacts.get(contactId);
  if (!existing) return;
  const prior = existing.threads[source] ?? [];
  const threads = { ...existing.threads, [source]: [...prior, entry] };
  const sources = existing.sources.includes(source)
    ? existing.sources
    : [...existing.sources, source];
  await db.contacts.update(contactId, {
    threads,
    sources,
    lastMsg: lastMsgPreview,
    lastActive: 'Just now'
  });
}

export async function addNote(
  contactId: string,
  text: string,
  type: NoteEntry['type'] = 'note'
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const note: NoteEntry = { id: newId(), type, text: trimmed, ts: nowTs() };
  await appendToThread(contactId, 'notes', note, previewOf(trimmed));
}

export async function sendMockMessage(
  contactId: string,
  source: SourceKey,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const outgoing: Message = {
    id: newId(),
    dir: 'out',
    text: trimmed,
    ts: nowTs()
  };
  await appendToThread(contactId, source, outgoing, previewOf(trimmed));

  const channelLabel =
    source === 'email'
      ? 'email'
      : source === 'bluesky'
        ? 'DM on Bluesky'
        : source === 'telegram'
          ? 'Telegram message'
          : source === 'signal'
            ? 'Signal message'
            : 'message';
  const logNote: NoteEntry = {
    id: newId(),
    type: 'note',
    text: `Mocked sending ${channelLabel}: "${previewOf(trimmed)}"`,
    ts: nowTs()
  };
  await appendToThread(contactId, 'notes', logNote, previewOf(trimmed));

  const replies = [
    'Thanks for the ping!',
    'Got it — will take a look.',
    'Appreciate you reaching out.',
    'Sounds good, let me think on it.',
    'Ha, same energy. More soon.'
  ];
  const replyText = replies[Math.floor(Math.random() * replies.length)];
  setTimeout(async () => {
    const reply: Message = {
      id: newId(),
      dir: 'in',
      text: replyText,
      ts: nowTs()
    };
    await appendToThread(contactId, source, reply, previewOf(replyText));
  }, 1400);
}

function formatChatTime(sentAt: string): string {
  const d = new Date(sentAt);
  if (Number.isNaN(d.getTime())) return sentAt;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function pickPeer(members: ChatMember[], userDid: string): ChatMember | null {
  const others = members.filter((m) => m.did !== userDid);
  // 1:1 DMs are the supported case. Group convos exist in lex but the CRM is
  // person-keyed — pick the first non-self member and treat it as the contact.
  // If we can't find a peer (e.g. self-message), bail.
  return others[0] ?? null;
}

async function ensureContactFromMember(member: ChatMember): Promise<Contact> {
  const existing = await db.contacts.get(member.did);
  if (existing) {
    // Convo response has fresh handle/avatar; refresh them in case the user
    // renamed since the contact was first seeded.
    const patch: Partial<Contact> = {};
    if (member.handle && member.handle !== existing.handle) patch.handle = member.handle;
    if (member.avatar && member.avatar !== existing.avatarUrl) patch.avatarUrl = member.avatar;
    if (Object.keys(patch).length > 0) await db.contacts.update(member.did, patch);
    return { ...existing, ...patch };
  }

  return addContactFromDid(member.did, {
    handleHint: member.handle,
    avatarHint: member.avatar,
    displayNameHint: member.displayName,
    discoveredVia: 'manual'
  });
}

function mergeBlueskyThread(
  existing: (Message | NoteEntry)[] | undefined,
  realMessages: Message[]
): (Message | NoteEntry)[] {
  // Real chat ids are deterministic (e.g. tids). Mock-sent messages use
  // randomUUID/`id_*` strings — they won't collide. Drop any existing entry
  // whose id matches an incoming real message so re-syncs don't duplicate,
  // then preserve any locally-added Notes/mocks that aren't part of the real
  // history.
  const realIds = new Set(realMessages.map((m) => m.id));
  const localOnly = (existing ?? []).filter((entry) => !realIds.has(entry.id));
  // Mock messages don't carry a sortable timestamp, so we keep them after the
  // real history. Acceptable for the prototype — once real messages arrive,
  // the mock turns are the trailing footnote rather than getting interleaved.
  const realMsgs: (Message | NoteEntry)[] = realMessages;
  const localNotes = localOnly.filter((entry) => !isMessage(entry));
  const localMessages = localOnly.filter(isMessage);
  return [...realMsgs, ...localNotes, ...localMessages];
}

async function applyConvoToContact(
  convo: ConvoView,
  peer: ChatMember,
  rawMessages: ChatMessageView[],
  userDid: string
): Promise<{ contactId: string; lastMessage: Message | null }> {
  const contact = await ensureContactFromMember(peer);

  const realMessages: Message[] = rawMessages.map((m) => ({
    id: m.id,
    dir: m.sender.did === userDid ? 'out' : 'in',
    text: m.text,
    ts: formatChatTime(m.sentAt)
  }));

  const fresh = await db.contacts.get(contact.id);
  if (!fresh) return { contactId: contact.id, lastMessage: null };

  const mergedThread = mergeBlueskyThread(fresh.threads.bluesky, realMessages);
  const sources = fresh.sources.includes('bluesky')
    ? fresh.sources
    : [...fresh.sources, 'bluesky' as SourceKey];

  const last = realMessages[realMessages.length - 1] ?? null;
  const lastSentAt = rawMessages[rawMessages.length - 1]?.sentAt;

  const patch: Partial<Contact> = {
    threads: { ...fresh.threads, bluesky: mergedThread },
    sources
  };
  if (last) {
    patch.lastMsg = previewOf(last.text);
    if (lastSentAt) {
      const d = new Date(lastSentAt);
      if (!Number.isNaN(d.getTime())) patch.lastActive = d.toLocaleDateString();
    }
  }
  if (typeof convo.unreadCount === 'number') patch.unread = convo.unreadCount;

  await db.contacts.update(contact.id, patch);
  return { contactId: contact.id, lastMessage: last };
}

export type BlueskyDMSyncResult = {
  /** Convos walked from listConvos (capped by MAX_PAGES). */
  convos: number;
  /** Convos that produced a new or updated contact this run. */
  updated: number;
  /** Convos skipped because the user had never sent a message there — these
   *  shouldn't become contacts per the product rule. */
  skippedNotSelfSent: number;
};

const BSKY_DM_SYNC_KEY_PREFIX = 'crm_bskyDmSyncedAt';
const BSKY_DM_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5m

function dmSyncKey(did: string): string {
  return `${BSKY_DM_SYNC_KEY_PREFIX}:${did}`;
}

/**
 * Walk every convo for the signed-in user, materialise contacts + threads for
 * any convo where the user has sent at least one message (the "I've already
 * sent a DM to" rule), and bookmark each convo's `rev` so the next sync only
 * re-fetches threads that have moved.
 */
export async function syncBlueskyDMs(
  session: OAuthSession,
  user: { did: string },
  opts: { force?: boolean; signal?: AbortSignal } = {}
): Promise<BlueskyDMSyncResult> {
  const { signal } = opts;
  const syncKey = dmSyncKey(user.did);
  if (!opts.force) {
    try {
      const last = Number(localStorage.getItem(syncKey) ?? '0');
      if (last && Date.now() - last < BSKY_DM_SYNC_INTERVAL_MS) {
        return { convos: 0, updated: 0, skippedNotSelfSent: 0 };
      }
    } catch {
      // localStorage unavailable — proceed anyway.
    }
  }

  let convos = 0;
  let updated = 0;
  let skippedNotSelfSent = 0;

  for await (const convo of listConvos(session, signal)) {
    if (signal?.aborted) break;
    convos++;

    const peer = pickPeer(convo.members ?? [], user.did);
    if (!peer) continue;

    const stored = await db.convos.get(convo.id);
    // If we've already bookmarked this convo at the same rev, no new messages
    // exist — skip regardless of contact state. "They-only" convos (no user
    // reply yet) have no contact by design; requiring `existingContact` here
    // would re-paginate their full history every sync window.
    if (stored && stored.rev === convo.rev) continue;

    const messages = await listMessages(session, convo.id, signal).catch((err) => {
      if (err instanceof ChatScopeError) throw err;
      console.warn('listMessages failed for convo', convo.id, err);
      return null;
    });
    if (!messages) continue;
    if (signal?.aborted) break;

    const userHasSent = messages.some((m) => m.sender.did === user.did);
    if (!userHasSent) {
      skippedNotSelfSent++;
      // Still bookmark the rev so we don't repeatedly re-fetch the same
      // unchanged "they messaged me but I haven't replied" thread. If the
      // user sends a message later, the rev will advance and we'll pick it
      // up on the next pass.
      await db.convos.put({ convoId: convo.id, contactId: peer.did, rev: convo.rev });
      continue;
    }

    await applyConvoToContact(convo, peer, messages, user.did);
    await db.convos.put({ convoId: convo.id, contactId: peer.did, rev: convo.rev });
    updated++;
  }

  if (!signal?.aborted) {
    try {
      localStorage.setItem(syncKey, String(Date.now()));
    } catch {
      // localStorage unavailable — the next run will just re-sync.
    }
  }

  return { convos, updated, skippedNotSelfSent };
}

/**
 * Per-contact resync: looks up the stored convo for `contactId` and refetches
 * its messages. Falls back to a full sync if we don't have a convo bookmark
 * yet (e.g. a manually-added contact that we know has DMs but haven't synced).
 */
export async function refreshBlueskyContactDMs(
  session: OAuthSession,
  user: { did: string },
  contactId: string,
  signal?: AbortSignal
): Promise<void> {
  const bookmark = await db.convos.where('contactId').equals(contactId).first();
  if (!bookmark) {
    await syncBlueskyDMs(session, user, { force: true, signal });
    return;
  }
  const messages = await listMessages(session, bookmark.convoId, signal);
  if (signal?.aborted) return;
  const contact = await db.contacts.get(contactId);
  if (!contact) return;
  const peer: ChatMember = {
    did: contact.did,
    handle: contact.handle,
    displayName: contact.name,
    avatar: contact.avatarUrl
  };
  // We don't have the fresh ConvoView rev here without listConvos; bump the
  // bookmark to a sentinel that forces the next full sync to revisit. The
  // next listConvos walk will overwrite it with the authoritative rev.
  await applyConvoToContact(
    { id: bookmark.convoId, rev: bookmark.rev, members: [peer] },
    peer,
    messages,
    user.did
  );
}

export async function refreshSifa(did: string, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return;
  const existing = await db.contacts.get(did);
  if (!existing) return;
  const sifa = await fetchSifaProfile(did, signal).catch(() => null);
  if (!sifa || signal?.aborted) return;
  await db.contacts.update(did, {
    sifa,
    location: formatAddress(sifa.self?.location) ?? existing.location
  });
}
