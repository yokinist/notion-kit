# @yokinist/notion-fetch

**[Documentation](https://notion-kit-docs.vercel.app/docs/notion-fetch)** · [Demo](https://notion-kit-docs.vercel.app/docs/demo) · [Examples](https://github.com/yokinist/notion-kit/tree/main/examples)

Small helpers for building sites on the [official Notion API](https://developers.notion.com) (`@notionhq/client`):

- **Rate-limit safe requests.** Notion allows about 3 requests per second per integration. Statically generating many pages at once hits that quickly, and the official client gives up after a couple of retries. `createRequestLimiter` caps requests in flight and keeps retrying rate limits (waiting for Notion's `retry_after`) and timeouts.
- **Whole pages in one call.** `fetchBlockTree` returns a page's content with nested blocks under `children`, following pagination.
- **Files that do not expire.** Files uploaded to Notion get signed URLs that expire after an hour, so pages cached by a CDN or ISR end up with broken images. `createFileHandler` is a request handler you link to instead: it redirects to a fresh URL and lets the CDN cache the redirect. No image optimization service needed.
- **Database rows and property values.** `queryDatabase` and `getPropertyText` / `getPropertyNames` / `getPropertyDate`.

No React, no framework: everything is plain functions and a Web-standard `Request → Response` handler.

## Install

```bash
npm install @yokinist/notion-fetch @notionhq/client
```

Works with `@notionhq/client` 5.x (Notion API version 2025-09-03, with data sources). CI tests the oldest and newest 5.x releases, and checks each new release weekly.

Create an [internal integration](https://www.notion.so/profile/integrations), and share your database with it (database page → **⋯ → Connections**).

## Usage

```ts
import { Client } from "@notionhq/client";
import {
  createRequestLimiter,
  fetchBlockTree,
  getPropertyDate,
  getPropertyText,
  queryDatabase,
} from "@yokinist/notion-fetch";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const limit = createRequestLimiter(); // share one per process

const rows = await queryDatabase(notion, process.env.NOTION_DATABASE_ID, { limit });
const posts = rows.map((row) => ({
  id: row.id,
  title: getPropertyText(row.properties.title),
  date: getPropertyDate(row.properties.date),
}));

const blocks = await fetchBlockTree(notion, posts[0].id, { limit });
```

### Files

Serve the handler at a route whose last path segment is the block ID, and point `<img>`, `<video>` and links at it:

```ts
// Next.js: app/api/notion/file/[id]/route.ts
import { Client } from "@notionhq/client";
import { createFileHandler } from "@yokinist/notion-fetch";

export const GET = createFileHandler({
  notion: new Client({ auth: process.env.NOTION_TOKEN }),
});
```

```tsx
<img src={`/api/notion/file/${block.id}`} alt="" />
```

It works for image, video, audio, file and PDF blocks; external URLs are redirected as they are. The redirect is cached by the CDN for 40 minutes by default (`cacheSeconds`), well within the URL's one-hour lifetime. The same handler works with Hono, Cloudflare Workers and anything else that speaks `Request`/`Response`.

### Sharing work between pages

When pages are generated in parallel, `createDedupe` lets them share one fetch of the same data:

```ts
import { createDedupe } from "@yokinist/notion-fetch";

const dedupe = createDedupe();
const rows = await dedupe(`rows:${databaseId}`, () =>
  queryDatabase(notion, databaseId, { limit }),
);
```

A failed fetch is not kept, so the next caller tries again.

## API

| Function | Returns |
| --- | --- |
| `createRequestLimiter({ concurrency = 2, maxRetries = 10 })` | `limit(send)`: runs `send` within the cap, retrying 429s and timeouts |
| `fetchBlockTree(notion, pageId, { limit })` | `NotionBlock[]`; nested blocks under `children`. Child pages and databases are not descended into |
| `queryDatabase(notion, databaseId, { limit })` | every row (`PageObjectResponse[]`) of the database's first data source |
| `createFileHandler({ notion, cacheSeconds = 2400, limit })` | `(request: Request) => Promise<Response>` |
| `createDedupe()` | `dedupe(key, fetch)` |
| `getPropertyText(property)` | text of title, rich text, select, status and url properties |
| `getPropertyNames(property)` | option names of a multi-select property |
| `getPropertyDate(property)` | start of a date property |

## License

MIT
