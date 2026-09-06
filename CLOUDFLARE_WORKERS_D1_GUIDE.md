# Veilhouse: Cloudflare Workers + D1 Deployment Guide

## Read this first

The downloaded Veilhouse package is **not directly deployable to Cloudflare Workers** with one `wrangler deploy` command. It currently uses:

- Node.js and Express;
- tRPC running through Express;
- Drizzle with MySQL/TiDB (`mysql2`);
- S3-compatible storage;
- Manus OAuth and server-side cookies; and
- Node-oriented scheduling.

Cloudflare Workers uses the Workers runtime, D1 uses SQLite semantics, and R2 replaces S3-style storage. If you upload the current package unchanged, the React page may build, but the curator desk, `/api/trpc`, database, uploads, authentication, and scheduled publishing will not work.

Use the current Manus deployment as the rollback site while completing this migration.

## What will be created

| Component | Cloudflare service | Purpose |
|---|---|---|
| React client + API Worker | Workers + Workers Assets | Serves the SPA and API from one deployment |
| Application database | D1 | SQLite-compatible production database |
| Images and videos | R2 | Managed object storage |
| Scheduled publishing | Cron Triggers | Replaces the Node scheduler |
| `veilhouse.monster` | Workers Custom Domain | Production hostname and HTTPS |

## Prerequisites

Install these locally:

- Node.js 20 or newer;
- pnpm or npm;
- a Cloudflare account;
- the `veilhouse.monster` domain; and
- access to the Manus OAuth configuration if you want the curator login to continue working.

Check the tools:

```bash
node --version
pnpm --version
```

## Phase 1: Make a separate migration workspace

Do not modify the only copy of the working Manus deployment.

```bash
unzip veilhouse-cloudflare-source.zip
cd veilhouse-editable
cp -a . ../veilhouse-cloudflare-migration
cd ../veilhouse-cloudflare-migration
pnpm install
```

Create a separate Git branch or repository for this migration:

```bash
git init
git add .
git commit -m "Import Veilhouse before Cloudflare migration"
```

Never commit `.env` files, database passwords, OAuth secrets, JWT secrets, or API keys.

## Phase 2: Create the Workers shell

Cloudflare’s current React + Vite workflow uses the Cloudflare Vite plugin and a `wrangler.jsonc` file. The cleanest approach is to scaffold a Workers React project and then move the Veilhouse client into it:

```bash
cd ..
pnpm create cloudflare@latest veilhouse-workers --framework=react
cd veilhouse-workers
pnpm install
pnpm add -D @cloudflare/vite-plugin wrangler
```

Choose the TypeScript React option. Keep the generated `worker/` directory, Cloudflare Vite plugin, and `wrangler.jsonc` as the deployment foundation. Copy the Veilhouse UI files into the generated client/src structure and merge the routes, styles, images, and components rather than overwriting the Worker configuration.

The target shape should be approximately:

```text
veilhouse-workers/
  client/ or src/       # Veilhouse React UI
  worker/index.ts       # Cloudflare Worker API entry point
  migrations/           # D1 SQL migrations
  wrangler.jsonc
  vite.config.ts
  package.json
```

For a standard Vite React Worker, the configuration starts like this:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "veilhouse",
  "main": "worker/index.ts",
  "compatibility_date": "2026-09-05",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "veilhouse-prod",
      "database_id": "REPLACE_AFTER_CREATE"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "veilhouse-media"
    }
  ],
  "triggers": {
    "crons": ["*/15 * * * *"]
  }
}
```

The `nodejs_compat` flag does **not** make every Node package compatible. In particular, do not assume `express`, `mysql2`, or the current S3 SDK path will work in Workers.

## Phase 3: Create the D1 production database

Authenticate Wrangler:

```bash
npx wrangler login
```

Create the production D1 database:

```bash
npx wrangler d1 create veilhouse-prod
```

Wrangler prints a database ID. Put that ID into `wrangler.jsonc` under `d1_databases`. The binding name used by Worker code is `env.DB`.

Create a local and remote migration directory:

```bash
mkdir -p migrations
```

### Important: do not run the MySQL migration unchanged

The current `drizzle/*.sql` files are MySQL-oriented. D1 requires SQLite SQL. Convert the schema before applying it:

| MySQL/TiDB form | D1/SQLite form |
|---|---|
| `AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
| `varchar(...)` / `text` | `TEXT` |
| `timestamp` | `TEXT` ISO timestamp or `INTEGER` epoch milliseconds |
| `mysqlEnum` | `TEXT` plus an optional `CHECK` constraint |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT (...) DO UPDATE` |
| MySQL backticks and functions | SQLite-compatible syntax |

Start with a D1 migration such as `migrations/0001_base.sql` and create **all** required application tables, not just subscribers and curator settings. A minimal start for the two newest tables is:

```sql
CREATE TABLE IF NOT EXISTS curator_settings (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'dispatch',
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO curator_settings (id, email)
VALUES (1, 'brilliantelay5@gmail.com')
ON CONFLICT(id) DO UPDATE SET email = excluded.email;
```

The existing curator-post and revision tables must also be converted before the curator desk can work. For the D1 version, replace the current `drizzle-orm/mysql2` connection with a D1 adapter such as `drizzle-orm/d1`, or use direct `env.DB.prepare(...)` queries in Worker procedures.

Apply and verify locally first:

```bash
npx wrangler d1 execute veilhouse-prod --local --file=./migrations/0001_base.sql
npx wrangler d1 execute veilhouse-prod --local --command="SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
```

Apply to production only after local tests pass:

```bash
npx wrangler d1 execute veilhouse-prod --remote --file=./migrations/0001_base.sql
npx wrangler d1 execute veilhouse-prod --remote --command="SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
```

For future changes, use numbered migrations and apply them in order. Do not repeatedly execute an all-in-one destructive schema file against production.

## Phase 4: Create the R2 media bucket

Create the bucket used for curator image and video uploads:

```bash
npx wrangler r2 bucket create veilhouse-media
npx wrangler r2 bucket list
```

The Worker can then use `env.MEDIA.put(key, requestBody)` and `env.MEDIA.get(key)`. Replace the current S3 helper with an R2 helper. Keep media behind Worker-controlled routes or signed URLs; do not expose unrestricted write access from the browser.

## Phase 5: Port the backend before deploying the UI

Create `worker/index.ts` as the only production API entry point. Port the current backend in this order:

1. health endpoint, for example `GET /api/health`;
2. public published-post query;
3. curator authentication and signed session cookie;
4. curator post create/update/delete/list procedures;
5. R2 upload and media retrieval;
6. subscriber signup and curator subscriber list;
7. scheduling and cron-triggered publishing.

You may use Hono or another Workers-compatible router. The current Express server is not the target runtime. Keep the client’s `/api/trpc` contract only if you port the tRPC server to a Workers-compatible adapter; otherwise update the client to call the new Worker routes.

Before adding the custom domain, verify all of these against a temporary `workers.dev` URL:

```text
GET  /api/health
GET  /api/posts/published
POST /api/subscribers
POST /api/curator/unlock
GET  /api/curator/posts
POST /api/curator/media
```

## Phase 6: Add production secrets and variables

Use Wrangler secrets. Do not commit secret values:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put MANUS_OAUTH_CLIENT_SECRET
npx wrangler secret put MANUS_OAUTH_CLIENT_ID
npx wrangler secret put CURATOR_EMAIL
```

Add non-secret environment variables in `wrangler.jsonc` or the Cloudflare dashboard. The exact Manus OAuth variable names depend on the OAuth integration you port. At minimum, update the OAuth callback URL to the final production URL:

```text
https://veilhouse.monster/api/oauth/callback
```

Do not put the current `DATABASE_URL`, `BUILT_IN_FORGE_API_KEY`, or S3 credentials into the Worker unless you have intentionally replaced those integrations and verified that the target API is Workers-compatible.

## Phase 7: Run locally in the Workers runtime

Use Wrangler/Vite rather than the old `tsx watch server/_core/index.ts` command:

```bash
pnpm dev
```

Test the local D1 binding and Worker API. If local bindings are needed, Wrangler stores local state under `.wrangler/state`; never commit that directory.

Run the migration test checklist:

- public archive loads and client-side routes work after refresh;
- published posts load from D1;
- an unauthenticated visitor cannot access curator routes;
- any authenticated Manus account can enter `brilliantelay5@gmail.com` and receive a signed curator session;
- the curator can create, edit, publish, and delete a post;
- image and video uploads reach R2;
- subscriber signup creates one unique row in D1;
- changing the curator email invalidates the old curator session;
- the cron endpoint cannot be triggered by an ordinary public request.

## Phase 8: Deploy to a temporary Workers URL

After the Worker and bindings are working locally:

```bash
pnpm build
npx wrangler deploy
```

Wrangler will print a temporary `workers.dev` URL. Test the complete application there before touching `veilhouse.monster`.

## Phase 9: Connect `veilhouse.monster`

In Cloudflare:

1. Add `veilhouse.monster` to the Cloudflare account.
2. At Dynadot, replace the domain nameservers with the two Cloudflare nameservers assigned to your zone.
3. In **Workers & Pages → your Worker → Settings → Domains & Routes**, add `veilhouse.monster` as a Custom Domain.
4. Add `www.veilhouse.monster` as a second Custom Domain if you want both forms to work.
5. Keep any email MX records at Dynadot/Cloudflare intact.
6. Wait for certificate issuance and DNS propagation.
7. Update the Manus OAuth callback and any allowed-origin settings to the final HTTPS domain.

Cloudflare Custom Domains are preferred for a Worker that is the application origin. Do not guess an A record or point the domain at the old Manus hostname once the Worker is ready.

## Phase 10: Cutover and rollback

Before cutover, record:

- the current Manus URL;
- the Cloudflare Worker URL;
- the D1 database name and ID;
- the R2 bucket name;
- the OAuth callback URLs; and
- the latest known-good application checkpoint.

If anything fails after cutover, remove the Worker Custom Domain and restore the prior Manus DNS/hosting route while debugging the Cloudflare version. Keep the old Manus site live until the Cloudflare version has passed at least one complete curator publishing cycle.

## Current status of the supplied package

The clean ZIP is a safe **source handoff**, not a finished Cloudflare migration. It intentionally does not include a fake `wrangler.jsonc` or a partially compatible Worker because that would create deployment conflicts and could make the site appear live while disabling the curator backend.

References:

- [Cloudflare React + Vite Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)
- [Cloudflare D1 getting started](https://developers.cloudflare.com/d1/get-started/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
