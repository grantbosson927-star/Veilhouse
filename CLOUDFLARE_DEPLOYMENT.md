# Veilhouse Cloudflare Deployment Notes

## Important compatibility note

Veilhouse is a full-stack application. The public React interface is only one part of the project; the curator desk and its features depend on a Node/Express server, MySQL/TiDB through Drizzle, S3-compatible managed storage, Manus OAuth, signed sessions, and scheduled publishing.

**Do not upload `dist/public` to Cloudflare Pages and expect the complete application to work.** That would publish the visual shell, but `/api/trpc` would have no backend and the curator desk, authentication, database queries, subscriber list, media uploads, and scheduling would fail.

The source package is intentionally kept in its working Node format so it can be downloaded without silently losing functionality.

## Safe deployment choices

### Choice A: Public-only Cloudflare Pages deployment

Use this only if you want the public archive to be a static showcase. Build with:

```bash
pnpm install
pnpm build
```

For Cloudflare Pages, use `dist/public` as the output directory. This option does **not** provide the curator desk, login, subscriber persistence, media uploads, scheduled publishing, or database-backed content.

### Choice B: Full-featured Cloudflare migration

To run the complete product on Cloudflare, migrate the runtime instead of deploying the current Node server unchanged:

| Current Veilhouse component | Cloudflare target |
|---|---|
| Express + tRPC Node server | Cloudflare Workers with a Workers-compatible router such as Hono, or an explicitly tested Express-on-Workers adapter |
| MySQL/TiDB + Drizzle | Cloudflare D1 for SQLite-compatible queries, or external MySQL through Hyperdrive |
| S3-compatible media storage | Cloudflare R2 with signed upload/download URLs |
| Manus OAuth and cookie sessions | Workers-compatible OAuth/session implementation, with production callback URLs updated |
| Scheduled curator publishing | Workers Cron Triggers plus durable job state in D1 |
| Vite React client | Workers Assets or Pages frontend |

This is a code migration, not a DNS-only change. Keep the current Manus deployment available until the Cloudflare version has passed authentication, curator access, database, upload, subscription, and scheduled-publishing tests.

## DNS and domain setup

Cloudflare can manage DNS for `veilhouse.monster` without changing the registrar. After the final deployment target exists:

1. Add `veilhouse.monster` to Cloudflare.
2. Change Dynadot nameservers to the two nameservers Cloudflare assigns.
3. Add the DNS records Cloudflare or the selected deployment target provides.
4. Configure both the apex domain and `www` if both should work.
5. Do not delete MX records if the domain is used for email.
6. Verify HTTPS and the production OAuth callback before switching visitors over.

Do not invent A or CNAME values. The correct target depends on whether the final deployment uses Pages, Workers, or an external Node host.

## Environment variables that must not be committed

The full-stack deployment requires runtime secrets such as the database URL, JWT secret, Manus OAuth values, built-in API keys, and storage credentials. Keep them in the target platform's encrypted environment/secret store. Never place them in this ZIP, `client/public`, or committed `.env` files.

## Recommended migration order

1. Keep the current Manus site as the rollback deployment.
2. Create the Cloudflare Workers/D1/R2 architecture in a separate branch or project.
3. Port one backend boundary at a time: health check, public posts, curator auth, posts, media, subscribers, then scheduling.
4. Run end-to-end tests against a staging hostname.
5. Connect `veilhouse.monster` only after all private and public flows pass.
6. Keep the Manus hostname available until DNS and OAuth propagation are confirmed.

## Current verified source

The included source corresponds to the working Veilhouse project with curator sign-out, editable curator email settings, persistent dispatch subscribers, signed curator access, database migrations, and the current production build. The project uses the normal Node scripts in `package.json`; no Cloudflare-only shim has been added because adding one prematurely would create a misleading, partially working deployment.
