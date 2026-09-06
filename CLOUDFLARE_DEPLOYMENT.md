# Veilhouse Cloudflare deployment

The live Worker is `veilhouse` (`https://veilhouse.grantbosson927.workers.dev`) and is already attached to `https://veilhouse.monster`. Archive images ship as Worker assets. Curator and submission images/videos are stored in the `veilhouse-media` R2 bucket and served from `/media/{key}`. Application data lives in the `veilhouse-prod` D1 database.

## Required token permissions

The API token used by Wrangler must include:

- Account Settings: Read
- Workers Scripts: Edit
- Workers Routes: Edit
- D1: Edit
- Workers R2 Storage: Edit
- Account: Read

Then set (do not commit):

```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=1cfcfab83ba00e9b699777bdd34aac0e
JWT_SECRET=...long random secret...
CURATOR_EMAIL=brilliantelay5@gmail.com
```

Or run `pnpm exec wrangler login` once in this folder.

## Deploy

```bash
pnpm install
pnpm cf:deploy
pnpm exec wrangler secret put JWT_SECRET
pnpm media:upload
```

`pnpm cf:deploy` builds the Vite client, applies D1 migrations, and publishes the Worker. After a successful deploy, both `veilhouse.grantbosson927.workers.dev` and `veilhouse.monster` serve this app.

## Local

```bash
pnpm cf:dev
```

Public archive pages also work with `pnpm dev`. Curator uploads in Node fall back to `.data/media` when R2 is not bound.
