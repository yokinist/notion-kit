# @yokinist/notion-rsc

Render Notion pages with [React Server Components](https://react.dev/reference/rsc/server-components), using the [official Notion API](https://developers.notion.com).

- **No client JavaScript for content.** Blocks render on the server to plain, semantic HTML (`p`, `h2`, `ul`, `figure`, `table`, …). The only client component is the click-to-load player for YouTube / Spotify / SoundCloud embeds.
- **Code and math on the server.** Code blocks are highlighted with [Shiki](https://shiki.style) (light and dark themes), equations with [KaTeX](https://katex.org), both at render time.
- **Embeds without third-party cookies.** Players show a preview from oEmbed and load the iframe only when clicked. Posts on X use [react-tweet](https://react-tweet.vercel.app). Bookmarks show the linked page's title and description.
- **Fast first paint.** The lead image is loaded eagerly with `fetchpriority="high"`, the rest lazily.
- **Bring your own styles.** Works with Tailwind's `prose` or any typography CSS; an optional stylesheet covers the Notion-specific parts.

It needs React 19 and nothing else: no Next.js dependency. It works in any RSC framework (Next.js App Router, Waku, React Router, …) and with `react-dom/static` `prerender`.

## Compared with react-notion-x

[react-notion-x](https://github.com/NotionX/react-notion-x) renders the data from Notion's unofficial, private API and runs as client components. This package renders the official API's block objects (`@notionhq/client`), so it works with an integration token and does not break when Notion changes its private API. Rendering on the server means no renderer, Shiki or KaTeX in your JavaScript bundle. In exchange, it covers page content only: no database views (Notion's collection views).

## Install

```bash
npm install @yokinist/notion-rsc @notionhq/client
# optional, enables each feature when installed
npm install shiki katex react-tweet
```

Without `shiki`, code is shown as plain `<pre><code>`; without `katex`, equations as their TeX source; without `react-tweet`, posts on X as bookmarks.

## Usage

Fetch a page's blocks with their children, e.g. with [`@yokinist/notion-fetch`](https://github.com/yokinist/notion-kit/tree/main/packages/notion-fetch), and pass them to `<NotionBlocks>`:

```tsx
import { Client } from "@notionhq/client";
import { fetchBlockTree } from "@yokinist/notion-fetch";
import { NotionBlocks } from "@yokinist/notion-rsc";
import "@yokinist/notion-rsc/styles.css";
import "katex/dist/katex.min.css"; // if you use equations

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function Page({ params }) {
  const { id } = await params;
  const blocks = await fetchBlockTree(notion, id);
  return (
    <article className="prose">
      <NotionBlocks blocks={blocks} />
    </article>
  );
}
```

`blocks` is an array of `BlockObjectResponse` with nested blocks under `children`.

## Options

```tsx
<NotionBlocks
  blocks={blocks}
  // Links to other Notion pages: return a path on your site, or undefined for notion.so
  pageUrl={(pageId) => slugs.get(pageId) && `/posts/${slugs.get(pageId)}`}
  // URL for files uploaded to Notion (see below)
  fileUrl={(blockId) => `/api/notion/file/${blockId}`}
  // Passed to fetch for oEmbed and link previews
  fetchInit={{ next: { revalidate: 86400 } }}
  // UI text
  labels={{ play: "再生" }}
  components={{
    Link: NextLink, // links to pages on your site
    Tweet: MyTweet, // replaces react-tweet
  }}
/>
```

### Files uploaded to Notion

Notion's URLs for uploaded files expire after an hour, which breaks images on statically generated or cached pages. Without `fileUrl`, those URLs are used as they are, which is fine for pages rendered on every request. For cached pages, point `fileUrl` at a route that redirects to a fresh URL, such as `createFileHandler` from `@yokinist/notion-fetch`:

```ts
// Next.js: app/api/notion/file/[id]/route.ts
import { Client } from "@notionhq/client";
import { createFileHandler } from "@yokinist/notion-fetch";

export const GET = createFileHandler({
  notion: new Client({ auth: process.env.NOTION_TOKEN }),
});
```

## Styling

The markup is the HTML you would write by hand, so typography styles such as Tailwind's [`prose`](https://github.com/tailwindlabs/tailwindcss-typography) cover most of it. `@yokinist/notion-rsc/styles.css` adds styles for the Notion-specific parts, all under `notion-*` classes:

| Class | Block |
| --- | --- |
| `notion-callout` | callout |
| `notion-to-do` | to-do item |
| `notion-columns` | column list |
| `notion-table` | table |
| `notion-table-of-contents` | table of contents |
| `notion-code` | code |
| `notion-equation` | block equation |
| `notion-bookmark` | bookmark |
| `notion-embed` | embed player |
| `notion-color-*` | text colors, e.g. `notion-color-red`, `notion-color-red-background` |

Dark mode follows `prefers-color-scheme`, or a `.dark` class on an ancestor. The stylesheet also switches Shiki's `--shiki-light` / `--shiki-dark` colors the same way.

## Supported blocks

Paragraph, headings 1–3, bulleted / numbered lists, to-do, toggle, quote, callout, divider, code, equation, table, column list, table of contents, image, video, audio, file, PDF, bookmark, embed, link preview, synced blocks, and links to pages (child pages and link-to-page blocks, shown when `pageUrl` returns a path). Databases are skipped.

## License

MIT
