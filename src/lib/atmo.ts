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

// Pairwise mutual lookup checks each candidate's PDS for a return follow
// record, so the cost is O(N) PDS round-trips. We cap the number of outgoing
// follows we'll verify so a heavy user doesn't fan out into thousands of
// requests on every sync; mutuals beyond the cap are silently omitted but the
// `truncated` flag on the result surfaces it to the caller.
const FOLLOW_CAP = 500;
const PAIRWISE_CONCURRENCY = 6;

export async function mapWithLimit<T, R>(
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

type MutualSet = { ids: Set<string>; truncated: boolean };

async function bskyMutuals(did: string, signal?: AbortSignal): Promise<MutualSet> {
  const [follows, followers] = await Promise.all([
    getBlueskyFollows(did, signal).catch(() => ({ ids: new Set<string>(), truncated: false })),
    getBlueskyFollowers(did, signal).catch(() => ({ ids: new Set<string>(), truncated: false }))
  ]);
  const ids = new Set<string>();
  for (const d of follows.ids) if (followers.ids.has(d)) ids.add(d);
  return { ids, truncated: follows.truncated || followers.truncated };
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
): Promise<MutualSet> {
  const candidates = await listFollowSubjects(user.pds, user.did, collection, signal).catch(
    () => ({ ids: new Set<string>(), truncated: false })
  );
  if (candidates.ids.size === 0) {
    return { ids: new Set<string>(), truncated: candidates.truncated };
  }

  const all = Array.from(candidates.ids);
  const list = all.slice(0, FOLLOW_CAP);
  // Either upstream pagination capped, or we capped here.
  const truncated = candidates.truncated || all.length > FOLLOW_CAP;
  const results = await mapWithLimit(list, PAIRWISE_CONCURRENCY, async (cand) => {
    try {
      const candPds = await resolvePds(cand, signal);
      const candFollows = await listFollowSubjects(candPds, cand, collection, signal);
      return candFollows.ids.has(user.did) ? cand : null;
    } catch {
      return null;
    }
  });
  const ids = new Set<string>();
  for (const did of results) if (did) ids.add(did);
  return { ids, truncated };
}

export type AtmoMutualsResult = {
  /** did → list of platforms the user is mutuals with this person on */
  mutuals: Map<string, AtmoSource[]>;
  /** Per-platform truncation: true if upstream/cap limited the search and there
   *  are likely more mutuals than we discovered. */
  truncated: Partial<Record<AtmoSource, boolean>>;
};

const EMPTY_SET: MutualSet = { ids: new Set<string>(), truncated: false };

/**
 * Compute a `did → AtmoSource[]` map of every mutual connection across
 * supported platforms. Each platform fails soft: if the user has no Sifa
 * presence, the Sifa entry is just empty.
 *
 * The `truncated` map flags platforms where pagination caps (Bluesky's
 * BSKY_GRAPH_MAX_PAGES, the per-platform FOLLOW_CAP for pairwise lookups) may
 * have hidden additional mutuals. Callers can surface this so power users
 * understand why someone they follow doesn't appear yet.
 */
export async function findAtmosphereMutuals(
  user: { did: string },
  signal?: AbortSignal
): Promise<AtmoMutualsResult> {
  const pds = await resolvePds(user.did, signal).catch(() => null);
  const collections = pds
    ? await listRepoCollections(pds, user.did, signal).catch(() => [])
    : [];
  const has = (nsid: string) => collections.includes(nsid);

  const tasks: Promise<{ source: AtmoSource; result: MutualSet }>[] = [];

  tasks.push(
    bskyMutuals(user.did, signal)
      .catch(() => EMPTY_SET)
      .then((result) => ({ source: 'bluesky' as const, result }))
  );

  if (pds && has(SIFA_FOLLOW_NSID)) {
    tasks.push(
      pairwiseMutuals({ did: user.did, pds }, SIFA_FOLLOW_NSID, signal)
        .catch(() => EMPTY_SET)
        .then((result) => ({ source: 'sifa' as const, result }))
    );
  }

  if (pds && has(TANGLED_FOLLOW_NSID)) {
    tasks.push(
      pairwiseMutuals({ did: user.did, pds }, TANGLED_FOLLOW_NSID, signal)
        .catch(() => EMPTY_SET)
        .then((result) => ({ source: 'tangled' as const, result }))
    );
  }

  const taskResults = await Promise.all(tasks);
  const mutuals = new Map<string, AtmoSource[]>();
  const truncated: Partial<Record<AtmoSource, boolean>> = {};
  for (const { source, result } of taskResults) {
    if (result.truncated) truncated[source] = true;
    for (const did of result.ids) {
      if (did === user.did) continue;
      const prior = mutuals.get(did);
      if (prior) {
        if (!prior.includes(source)) prior.push(source);
      } else {
        mutuals.set(did, [source]);
      }
    }
  }
  return { mutuals, truncated };
}
