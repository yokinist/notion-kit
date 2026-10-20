# notion-kit on Cloudflare Workers

A blog on a Notion database that runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/): the [React Router example](../react-router-blog) in RSC Framework Mode, built with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/). `vite dev` and `vite preview` run it in workerd, the Workers runtime, so what works locally works when deployed.

React Router's RSC support is still marked unstable (`unstable_reactRouterRSC`).

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | The Worker: React Router's default RSC entry, with `nodejs_compat` so `process.env` holds its variables |
| `vite.config.ts` | Runs the RSC environment in the Worker, which calls the SSR one |
| `app/lib/notion.ts` | The Notion client, a shared rate limiter, and `getPosts()` reading the database |
| `app/routes/home.tsx` | The post list |
| `app/routes/post.tsx` | A post; links to other posts point to their pages here |
| `app/routes/file.ts` | A resource route that redirects to fresh URLs of files uploaded to Notion |

Two things differ from Node:

- `@notionhq/client` takes a Worker for a browser, because Workers define `WorkerGlobalScope`, and refuses the token. `app/lib/notion.ts` passes `dangerouslyAllowBrowser: true`; the token still stays on the server.
- Workers refuse to compile WebAssembly at runtime, so notion-rsc highlights code with Shiki's JavaScript regex engine.

## Start your own

```bash
npx giget@latest gh:yokinist/notion-kit/examples/cloudflare-blog my-blog
cd my-blog
cp .env.example .env.local   # NOTION_TOKEN and NOTION_DATABASE_ID
npm install
npm run dev
```

## Deploy

```bash
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put NOTION_DATABASE_ID
npm run deploy
```

`.env.local` is read only by `vite dev` and `vite preview`; the deployed Worker gets its variables from the secrets.

See [the examples README](..) for setting up the database and the integration.
