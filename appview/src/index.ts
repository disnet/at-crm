import { Contrail } from '@atmo-dev/contrail';
import { createHandler } from '@atmo-dev/contrail/server';
import { config } from './config';

const contrail = new Contrail(config);
const handle = createHandler(contrail);

let initialized = false;

type Env = { DB: D1Database };

async function ensureInit(env: Env): Promise<void> {
  if (!initialized) {
    await contrail.init(env.DB);
    initialized = true;
  }
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
