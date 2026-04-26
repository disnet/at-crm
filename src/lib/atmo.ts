/**
 * Discover mutual atmosphere connections (Bluesky, Sifa, Tangled) for a user.
 *
 * Bluesky has a public appview that exposes both follows and followers, so the
 * mutual computation is a straightforward set intersection.
 *
 * Sifa and Tangled don't (yet) have a public appview that exposes inbound
 * follows. For those platforms we list the user's outgoing follow records,
 * then verify each candidate by reading their follow records back from their
 * own PDS — keeping only those whose follow record points at the user.
 */

import {
  getBlueskyFollows,
  getBlueskyFollowers,
  listFollowSubjects,
  listRepoCollections,
  resolvePds
} from './atproto';
import type { AtmoSource } from './data';

const SIFA_FOLLOW_NSID = 'id.sifa.graph.follow';
const TANGLED_FOLLOW_NSID = 'sh.tangled.graph.follow';

const FOLLOW_CAP = 500;
const PAIRWISE_CONCURRENCY = 6;

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function bskyMutuals(did: string, signal?: AbortSignal): Promise<Set<string>> {
  const [follows, followers] = await Promise.all([
    getBlueskyFollows(did, signal).catch(() => new Set<string>()),
    getBlueskyFollowers(did, signal).catch(() => new Set<string>())
  ]);
  const out = new Set<string>();
  for (const d of follows) if (followers.has(d)) out.add(d);
  return out;
}

/**
 * Pairwise mutual computation for platforms without a public follower index.
 * For each DID the user follows, resolve their PDS and check whether their
 * follow records point back at the user — that's the only signal of a mutual
 * we can compute from public data.
 */
async function pairwiseMutuals(
  user: { did: string; pds: string },
  collection: string,
  signal?: AbortSignal
): Promise<Set<string>> {
  const candidates = await listFollowSubjects(user.pds, user.did, collection, signal).catch(
    () => new Set<string>()
  );
  if (candidates.size === 0) return new Set<string>();

  const list = Array.from(candidates).slice(0, FOLLOW_CAP);
  const results = await mapWithLimit(list, PAIRWISE_CONCURRENCY, async (cand) => {
    try {
      const candPds = await resolvePds(cand, signal);
      const candFollows = await listFollowSubjects(candPds, cand, collection, signal);
      return candFollows.has(user.did) ? cand : null;
    } catch {
      return null;
    }
  });
  const out = new Set<string>();
  for (const did of results) if (did) out.add(did);
  return out;
}

/**
 * Compute a `did → AtmoSource[]` map of every mutual connection across
 * supported platforms. Each platform fails soft: if the user has no Sifa
 * presence, the Sifa entry is just empty.
 */
export async function findAtmosphereMutuals(
  user: { did: string },
  signal?: AbortSignal
): Promise<Map<string, AtmoSource[]>> {
  const pds = await resolvePds(user.did, signal).catch(() => null);
  const collections = pds
    ? await listRepoCollections(pds, user.did, signal).catch(() => [])
    : [];
  const has = (nsid: string) => collections.includes(nsid);

  const tasks: Promise<{ source: AtmoSource; mutuals: Set<string> }>[] = [];

  tasks.push(
    bskyMutuals(user.did, signal)
      .catch(() => new Set<string>())
      .then((mutuals) => ({ source: 'bluesky' as const, mutuals }))
  );

  if (pds && has(SIFA_FOLLOW_NSID)) {
    tasks.push(
      pairwiseMutuals({ did: user.did, pds }, SIFA_FOLLOW_NSID, signal)
        .catch(() => new Set<string>())
        .then((mutuals) => ({ source: 'sifa' as const, mutuals }))
    );
  }

  if (pds && has(TANGLED_FOLLOW_NSID)) {
    tasks.push(
      pairwiseMutuals({ did: user.did, pds }, TANGLED_FOLLOW_NSID, signal)
        .catch(() => new Set<string>())
        .then((mutuals) => ({ source: 'tangled' as const, mutuals }))
    );
  }

  const results = await Promise.all(tasks);
  const merged = new Map<string, AtmoSource[]>();
  for (const { source, mutuals } of results) {
    for (const did of mutuals) {
      if (did === user.did) continue;
      const prior = merged.get(did);
      if (prior) {
        if (!prior.includes(source)) prior.push(source);
      } else {
        merged.set(did, [source]);
      }
    }
  }
  return merged;
}
