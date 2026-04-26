import Dexie, { type Table } from 'dexie';
import {
  formatAddress,
  type AtmoSource,
  type Contact,
  type Message,
  type NoteEntry,
  type SourceKey
} from './data';
import { fetchSifaProfile, getProfile, type ActorTypeahead } from './atproto';
import { findAtmosphereMutuals } from './atmo';

class CrmDB extends Dexie {
  contacts!: Table<Contact, string>;

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
};

export async function addContactFromDid(did: string, opts: AddContactOpts = {}): Promise<Contact> {
  const existing = await db.contacts.get(did);
  if (existing) return existing;

  const [profile, sifa] = await Promise.all([
    getProfile(did).catch(() => null),
    fetchSifaProfile(did).catch(() => null)
  ]);

  const handle = profile?.handle ?? opts.handleHint ?? did;
  const name =
    profile?.displayName?.trim() || opts.displayNameHint?.trim() || handle;

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
};

/**
 * Discovers atmosphere mutuals for the signed-in user and seeds them as
 * contacts (or annotates existing contacts with their mutual sources).
 * Existing manual contacts keep `discoveredVia: 'manual'` — they just gain
 * platform tags. Throttled to once per `ATMO_SYNC_INTERVAL_MS` per browser.
 */
export async function syncAtmosphereMutuals(
  user: { did: string },
  opts: { force?: boolean } = {}
): Promise<AtmoSyncResult> {
  const syncKey = atmoSyncKey(user.did);
  if (!opts.force) {
    try {
      const last = Number(localStorage.getItem(syncKey) ?? '0');
      if (last && Date.now() - last < ATMO_SYNC_INTERVAL_MS) {
        return { added: 0, annotated: 0, total: 0 };
      }
    } catch {
      // localStorage unavailable — proceed anyway.
    }
  }

  const mutuals = await findAtmosphereMutuals(user);
  let added = 0;
  let annotated = 0;

  for (const [did, sources] of mutuals) {
    const existing = await db.contacts.get(did);
    if (existing) {
      const merged = mergeAtmoSources(existing.mutualSources, sources);
      if (!sameAtmoSources(existing.mutualSources ?? [], merged)) {
        await db.contacts.update(did, { mutualSources: merged });
        annotated++;
      }
    } else {
      await addContactFromDid(did, {
        mutualSources: sources,
        discoveredVia: 'mutual'
      });
      added++;
    }
  }

  try {
    localStorage.setItem(syncKey, String(Date.now()));
  } catch {
    // localStorage unavailable — the next run will just re-sync.
  }

  return { added, annotated, total: mutuals.size };
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

export async function refreshSifa(did: string): Promise<void> {
  const existing = await db.contacts.get(did);
  if (!existing) return;
  const sifa = await fetchSifaProfile(did).catch(() => null);
  if (!sifa) return;
  await db.contacts.update(did, {
    sifa,
    location: formatAddress(sifa.self?.location) ?? existing.location
  });
}
