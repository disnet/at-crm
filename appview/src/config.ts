import type { ContrailConfig } from '@atmo-dev/contrail';

/**
 * Contrail configuration for the at-crm appview.
 *
 * Indexes the id.sifa.profile.* collections that the CRM reads when it
 * adds a Bluesky contact. Contrail's generated `listRecords` endpoint
 * natively accepts `?did=<did>` (or `?actor=<handle>`) and will backfill
 * a user's records from their PDS on first query — so we don't need to
 * declare `did` as a queryable field here.
 *
 * Namespace is `id.sifa`, so XRPC paths land at:
 *   /xrpc/id.sifa.self.listRecords?did=<did>
 *   /xrpc/id.sifa.position.listRecords?did=<did>
 *   ...etc.
 */
export const config: ContrailConfig = {
  namespace: 'id.sifa',
  collections: {
    self: {
      collection: 'id.sifa.profile.self',
      searchable: ['headline', 'about']
    },
    position: {
      collection: 'id.sifa.profile.position',
      queryable: {
        startedAt: { type: 'range' },
        endedAt: { type: 'range' }
      }
    },
    education: {
      collection: 'id.sifa.profile.education',
      queryable: {
        startedAt: { type: 'range' },
        endedAt: { type: 'range' }
      }
    },
    project: {
      collection: 'id.sifa.profile.project',
      queryable: {
        startedAt: { type: 'range' }
      }
    },
    publication: {
      collection: 'id.sifa.profile.publication',
      queryable: {
        publishedAt: { type: 'range' }
      }
    },
    skill: {
      collection: 'id.sifa.profile.skill'
    },
    externalAccount: {
      collection: 'id.sifa.profile.externalAccount'
    }
  }
};
