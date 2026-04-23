/**
 * Minimal AT Protocol client.
 * Uses Bluesky's public app view for actor lookups, then resolves the user's
 * PDS via their DID document so we can read sifa.id records directly.
 */

import type {
	SifaSelfData,
	SifaPosition,
	SifaEducation,
	SifaProject,
	SifaPublication,
	SifaSkill,
	SifaExternalAccount,
	SifaProfileData
} from './data';

const APPVIEW = 'https://public.api.bsky.app';
const PLC = 'https://plc.directory';

export type ActorTypeahead = {
	did: string;
	handle: string;
	displayName?: string;
	avatar?: string;
	description?: string;
};

export type BskyProfile = {
	did: string;
	handle: string;
	displayName?: string;
	avatar?: string;
	description?: string;
};

async function jsonGet<T>(url: string, signal?: AbortSignal): Promise<T> {
	const res = await fetch(url, { signal });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res.json() as Promise<T>;
}

export async function searchActorsTypeahead(
	q: string,
	signal?: AbortSignal
): Promise<ActorTypeahead[]> {
	const trimmed = q.trim();
	if (!trimmed) return [];
	const url = `${APPVIEW}/xrpc/app.bsky.actor.searchActorsTypeahead?q=${encodeURIComponent(trimmed)}&limit=8`;
	const data = await jsonGet<{ actors: ActorTypeahead[] }>(url, signal);
	return data.actors ?? [];
}

export async function getProfile(actor: string, signal?: AbortSignal): Promise<BskyProfile> {
	const url = `${APPVIEW}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`;
	return jsonGet<BskyProfile>(url, signal);
}

type DidDoc = {
	service?: { id: string; type: string; serviceEndpoint: string }[];
};

export async function resolvePds(did: string, signal?: AbortSignal): Promise<string> {
	let doc: DidDoc;
	if (did.startsWith('did:plc:')) {
		doc = await jsonGet<DidDoc>(`${PLC}/${did}`, signal);
	} else if (did.startsWith('did:web:')) {
		const host = did.slice('did:web:'.length).replace(/:/g, '/');
		doc = await jsonGet<DidDoc>(`https://${host}/.well-known/did.json`, signal);
	} else {
		throw new Error(`Unsupported DID method: ${did}`);
	}
	const svc = doc.service?.find(
		(s) => s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer'
	);
	if (!svc?.serviceEndpoint) throw new Error('No PDS endpoint in DID document');
	return svc.serviceEndpoint.replace(/\/$/, '');
}

async function getRecord<T>(
	pds: string,
	did: string,
	collection: string,
	rkey: string,
	signal?: AbortSignal
): Promise<T | null> {
	const url = `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=${collection}&rkey=${rkey}`;
	const res = await fetch(url, { signal });
	if (res.status === 400 || res.status === 404) return null;
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	const data = (await res.json()) as { value: T };
	return data.value;
}

async function listAllRecords<T>(
	pds: string,
	did: string,
	collection: string,
	signal?: AbortSignal
): Promise<T[]> {
	const out: T[] = [];
	let cursor: string | undefined;
	for (let i = 0; i < 10; i++) {
		const params = new URLSearchParams({
			repo: did,
			collection,
			limit: '100'
		});
		if (cursor) params.set('cursor', cursor);
		const url = `${pds}/xrpc/com.atproto.repo.listRecords?${params}`;
		const res = await fetch(url, { signal });
		if (res.status === 400 || res.status === 404) return out;
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		const data = (await res.json()) as { records: { value: T }[]; cursor?: string };
		for (const r of data.records ?? []) out.push(r.value);
		if (!data.cursor || data.records.length === 0) break;
		cursor = data.cursor;
	}
	return out;
}

export async function fetchSifaProfile(
	did: string,
	signal?: AbortSignal
): Promise<SifaProfileData> {
	const pds = await resolvePds(did, signal);
	const [self, positions, education, projects, publications, skills, externalAccounts] =
		await Promise.all([
			getRecord<SifaSelfData>(pds, did, 'id.sifa.profile.self', 'self', signal).catch(() => null),
			listAllRecords<SifaPosition>(pds, did, 'id.sifa.profile.position', signal).catch(() => []),
			listAllRecords<SifaEducation>(pds, did, 'id.sifa.profile.education', signal).catch(() => []),
			listAllRecords<SifaProject>(pds, did, 'id.sifa.profile.project', signal).catch(() => []),
			listAllRecords<SifaPublication>(pds, did, 'id.sifa.profile.publication', signal).catch(
				() => []
			),
			listAllRecords<SifaSkill>(pds, did, 'id.sifa.profile.skill', signal).catch(() => []),
			listAllRecords<SifaExternalAccount>(
				pds,
				did,
				'id.sifa.profile.externalAccount',
				signal
			).catch(() => [])
		]);

	const sortByDateDesc = (a?: string, b?: string): number => {
		if (!a && !b) return 0;
		if (!a) return 1;
		if (!b) return -1;
		return b.localeCompare(a);
	};

	positions.sort((a, b) => {
		if (!!a.endedAt !== !!b.endedAt) return a.endedAt ? 1 : -1;
		if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
		return sortByDateDesc(a.startedAt, b.startedAt);
	});
	education.sort((a, b) => sortByDateDesc(a.endedAt ?? a.startedAt, b.endedAt ?? b.startedAt));
	projects.sort((a, b) => sortByDateDesc(a.startedAt, b.startedAt));
	publications.sort((a, b) => sortByDateDesc(a.publishedAt, b.publishedAt));
	externalAccounts.sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));

	return {
		self,
		positions,
		education,
		projects,
		publications,
		skills,
		externalAccounts,
		fetchedAt: new Date().toISOString()
	};
}
