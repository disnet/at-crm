import Dexie, { type Table } from 'dexie';
import { formatAddress, type Contact } from './data';
import { fetchSifaProfile, getProfile, type ActorTypeahead } from './atproto';

class CrmDB extends Dexie {
	contacts!: Table<Contact, string>;

	constructor() {
		super('crm');
		this.version(1).stores({ contacts: 'id, order' });
		// v2 reshapes Contact (drops mock seed + adds sifa). Old rows are stale — clear.
		this.version(2)
			.stores({ contacts: 'id, order' })
			.upgrade((tx) => tx.table('contacts').clear());
	}
}

export const db = new CrmDB();

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

export async function addContactFromBluesky(actor: ActorTypeahead): Promise<Contact> {
	const existing = await db.contacts.get(actor.did);
	if (existing) return existing;

	const [profile, sifa] = await Promise.all([
		getProfile(actor.did).catch(() => null),
		fetchSifaProfile(actor.did).catch(() => null)
	]);

	const name = profile?.displayName?.trim() || actor.displayName?.trim() || actor.handle;

	const primaryPosition =
		sifa?.positions.find((p) => p.isPrimary && !p.endedAt) ??
		sifa?.positions.find((p) => !p.endedAt) ??
		sifa?.positions[0] ??
		null;

	const tagline =
		sifa?.self?.headline?.trim() ||
		(primaryPosition ? `${primaryPosition.title} · ${primaryPosition.company}` : '') ||
		profile?.description?.split('\n')[0]?.trim() ||
		`@${actor.handle}`;

	const primaryExternal =
		sifa?.externalAccounts.find((e) => e.isPrimary) ?? sifa?.externalAccounts[0] ?? null;

	const url = primaryExternal?.url || `https://bsky.app/profile/${actor.handle}`;

	const last = await db.contacts.orderBy('order').last();
	const order = (last?.order ?? 0) + 1;

	const contact: Contact = {
		id: actor.did,
		order,
		did: actor.did,
		handle: actor.handle,
		name,
		initials: initialsFrom(name),
		avatarColor: avatarColorForDid(actor.did),
		avatarUrl: profile?.avatar ?? actor.avatar,
		bio: profile?.description?.trim() || undefined,
		tagline,
		location: formatAddress(sifa?.self?.location),
		url,
		sources: ['bluesky'],
		lastMsg: `@${actor.handle}`,
		lastActive: 'Just added',
		unread: 0,
		reminder: null,
		threads: { bluesky: [] },
		sifa
	};

	await db.contacts.put(contact);
	return contact;
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
