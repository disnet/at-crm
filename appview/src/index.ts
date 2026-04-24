import { Contrail } from '@atmo-dev/contrail';
import { createHandler } from '@atmo-dev/contrail/server';
import { config } from './config';

const contrail = new Contrail(config);
const handle = createHandler(contrail);

// `contrail.init()` is idempotent (schema bootstraps use `CREATE TABLE IF NOT
// EXISTS`), but we still coalesce concurrent callers through a shared promise
// so a cold isolate doesn't fire two overlapping schema runs against D1.
let initPromise: Promise<void> | null = null;

type Env = { DB: D1Database };

function ensureInit(env: Env): Promise<void> {
  if (!initPromise) {
    initPromise = contrail.init(env.DB).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await ensureInit(env);
    return handle(request, env.DB);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await ensureInit(env);
    ctx.waitUntil(contrail.ingest({}, env.DB));
  }
};
