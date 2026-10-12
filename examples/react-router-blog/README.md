# notion-kit with React Router

A blog on a Notion database, with React Router's [RSC Framework Mode](https://reactrouter.com/how-to/react-server-components) on Vite. Routes export a `ServerComponent`, so `<NotionBlocks>` renders on the server.

React Router's RSC support is still marked unstable (`unstable_reactRouterRSC`).

| File | What it does |
| --- | --- |
| `app/lib/notion.ts` | The Notion client, a shared rate limiter, and `getPosts()` reading the database |
| `app/routes/home.tsx` | The post list |
| `app/routes/post.tsx` | A post; links to other posts point to their pages here |
| `app/routes/file.ts` | A resource route that redirects to fresh URLs of files uploaded to Notion |

See [the examples README](..) to set up the database and token, then:

```bash
npm run dev -w examples/react-router-blog
```
