# notion-kit with Next.js

**Preview:** https://notion-kit-next.vercel.app

A blog on a Notion database, with the Next.js App Router. Pages are static and revalidate every minute (ISR).

| File | What it does |
| --- | --- |
| `lib/notion.ts` | The Notion client, a shared rate limiter, and `getPosts()` reading the database |
| `app/page.tsx` | The post list |
| `app/posts/[slug]/page.tsx` | A post, rendered by `<NotionBlocks>`; links to other posts point to their pages here |
| `app/api/notion/file/[id]/route.ts` | Redirects to fresh URLs of files uploaded to Notion |

## Start your own

```bash
npx giget@latest gh:yokinist/notion-kit/examples/next-blog my-blog
cd my-blog
cp .env.example .env.local   # NOTION_TOKEN and NOTION_DATABASE_ID
npm install
npm run dev
```

See [the examples README](..) for setting up the database and the integration.
