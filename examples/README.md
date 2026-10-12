# Examples

Small blogs built on a Notion database with `@yokinist/notion-fetch` and `@yokinist/notion-rsc`. Each one has a post list, post pages, links between posts, and a route that serves files uploaded to Notion.

| Example | Framework |
| --- | --- |
| [`next-blog`](next-blog) | Next.js (App Router) |
| [`react-router-blog`](react-router-blog) | React Router (RSC Framework Mode, on Vite) |

## Set up

1. **Copy the sample database.** Duplicate the [notion-kit examples](https://www.notion.so/2fb6f63f6f694939bf584be023f1712f) page into your workspace, or use any database with a `title`, a `slug` (text), a `date` and, optionally, `summary` and `tags`.
2. **Create an integration** at https://www.notion.so/profile/integrations with only the **Read content** capability, and connect it to the page that holds the database (⋯ → Connections).
3. **Add the token.** Copy `.env.example` to `.env.local` in this folder and fill in `NOTION_TOKEN` and `NOTION_DATABASE_ID`. Every example reads this one file.

## Run

From the repository root:

```bash
npm install
npm run build -w packages
npm run dev -w examples/next-blog
```

Swap `next-blog` for another example's folder name to run that one.
