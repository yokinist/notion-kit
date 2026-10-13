# notion-kit with TanStack Start

**Preview:** https://notion-kit-tanstack-start.vercel.app

A blog on a Notion database, with TanStack Start's [Server Components](https://tanstack.com/start/latest/docs/framework/react/guide/server-components). A server function renders each post with `renderServerComponent(<NotionBlocks />)`, so the renderer stays on the server.

TanStack Start's Server Components support is still experimental.

| File | What it does |
| --- | --- |
| `src/lib/notion.ts` | The Notion client, a shared rate limiter, and `getPosts()` reading the database |
| `src/routes/index.tsx` | The post list, loaded through a server function |
| `src/routes/posts/$slug.tsx` | A post, rendered on the server; links to other posts point to their pages here |
| `src/routes/api/notion/file.$id.ts` | A server route that redirects to fresh URLs of files uploaded to Notion |

## Start your own

```bash
npx giget@latest gh:yokinist/notion-kit/examples/tanstack-start-blog my-blog
cd my-blog
cp .env.example .env.local   # NOTION_TOKEN and NOTION_DATABASE_ID
npm install
npm run dev
```

See [the examples README](..) for setting up the database and the integration.
