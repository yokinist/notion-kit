# notion-kit with React Router

**Preview:** https://notion-kit-react-router.vercel.app

A blog on a Notion database, with React Router's [RSC Framework Mode](https://reactrouter.com/how-to/react-server-components) on Vite. Routes export a `ServerComponent`, so `<NotionBlocks>` renders on the server.

React Router's RSC support is still marked unstable (`unstable_reactRouterRSC`).

| File | What it does |
| --- | --- |
| `app/lib/notion.ts` | The Notion client, a shared rate limiter, and `getPosts()` reading the database |
| `app/routes/home.tsx` | The post list |
| `app/routes/post.tsx` | A post; links to other posts point to their pages here |
| `app/routes/file.ts` | A resource route that redirects to fresh URLs of files uploaded to Notion |

## Start your own

```bash
npx giget@latest gh:yokinist/notion-kit/examples/react-router-blog my-blog
cd my-blog
cp .env.example .env.local   # NOTION_TOKEN and NOTION_DATABASE_ID
npm install
npm run dev
```

See [the examples README](..) for setting up the database and the integration.
