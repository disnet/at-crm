# at-crm-appview

A [Contrail](https://github.com/flo-bit/contrail) appview that indexes the
`id.sifa.profile.*` collections the CRM reads when it adds a Bluesky
contact. The Worker exposes typed XRPC endpoints under the `id.sifa`
namespace, so the client can fetch a full profile in a single request
instead of walking each user's PDS for seven `listRecords` calls.

## XRPC endpoints

Once deployed, Contrail auto-generates `listRecords` and `getRecord`
routes per collection under the configured namespace:

```
/xrpc/id.sifa.self.listRecords?did=<did>
/xrpc/id.sifa.position.listRecords?did=<did>
/xrpc/id.sifa.education.listRecords?did=<did>
/xrpc/id.sifa.project.listRecords?did=<did>
/xrpc/id.sifa.publication.listRecords?did=<did>
/xrpc/id.sifa.skill.listRecords?did=<did>
/xrpc/id.sifa.externalAccount.listRecords?did=<did>
```

Contrail's `listRecords` accepts `?did=<did>` or `?actor=<handle>`
natively and will backfill a user's records from their PDS on the
first query — so profiles appear even for DIDs the Jetstream cron
hasn't seen yet.

## Setup

```sh
npm install

# Create the D1 database, then copy the reported database_id into
# wrangler.jsonc's d1_databases[0].database_id.
npx wrangler d1 create at-crm-appview
```

## Develop

```sh
npm run sync      # discover + backfill against local D1
npm run dev       # local worker with Jetstream cron every minute
```

Probe it:

```sh
curl "http://localhost:8787/xrpc/id.sifa.self.listRecords?did=did:plc:..."
```

## Deploy

```sh
npm run deploy
npm run sync:remote
```

Jetstream ingestion runs automatically via the `*/1 * * * *` cron.

## Why separate from the SvelteKit app?

The SvelteKit app also deploys to Cloudflare (via `adapter-cloudflare`),
so co-hosting Contrail alongside it is technically possible. We keep
them apart because the appview has a different lifecycle:

- Its own `*/1 * * * *` Jetstream cron — collapsing would mean adding a
  `scheduled` handler to the SvelteKit Worker via a custom `_worker.js`
  wrapper, coupling ingestion to the UI's cold-start path.
- Its own D1 binding, schema, and one-shot `sync.ts` backfill tool.
- A distinct scaling profile: steady ingestion traffic vs. bursty UI
  requests.

The UI talks to this Worker as an XRPC appview over HTTPS, which is
the same shape it would use for any other atproto appview.
