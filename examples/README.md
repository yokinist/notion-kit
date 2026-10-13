# Examples

Small blogs built on a Notion database with `@yokinist/notion-fetch` and `@yokinist/notion-rsc`. Each one has a post list, post pages, links between posts, and a route that serves files uploaded to Notion.

| Example | Framework | Preview |
| --- | --- | --- |
| [`next-blog`](next-blog) | Next.js (App Router) | [notion-kit-next.vercel.app](https://notion-kit-next.vercel.app) |
| [`react-router-blog`](react-router-blog) | React Router (RSC Framework Mode) | [notion-kit-react-router.vercel.app](https://notion-kit-react-router.vercel.app) |
| [`tanstack-start-blog`](tanstack-start-blog) | TanStack Start (Server Components) | [notion-kit-tanstack-start.vercel.app](https://notion-kit-tanstack-start.vercel.app) |

React Router's and TanStack Start's Server Components support is still experimental.

## The database and the token

1. **A database** with a `title`, a `slug` (text), a `date` and, optionally, `summary` (text) and `tags` (multi-select). The [notion-kit examples](https://www.notion.so/2fb6f63f6f694939bf584be023f1712f) database has sample posts.
2. **An integration** from https://www.notion.so/profile/integrations with only the **Read content** capability, connected to the page that holds the database (⋯ → Connections).
3. **`.env.local`** with `NOTION_TOKEN` and `NOTION_DATABASE_ID`; see `.env.example`.

## Start your own blog from one

Each example is a complete project. Copy one out and run it:

```bash
npx giget@latest gh:yokinist/notion-kit/examples/next-blog my-blog
cd my-blog
cp .env.example .env.local   # then fill it in
npm install
npm run dev
```

## Run them in this repository

Put `.env.local` in this folder; every example reads it. Then, from the repository root:

```bash
npm install
npm run build -w packages
npm run dev -w examples/next-blog
```
