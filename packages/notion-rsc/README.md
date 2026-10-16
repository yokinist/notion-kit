# @yokinist/notion-rsc

**[Documentation](https://notion-kit-docs.vercel.app/docs/notion-rsc)** · [Demo](https://notion-kit-docs.vercel.app/docs/demo) · [Examples](https://github.com/yokinist/notion-kit/tree/main/examples)

Render Notion pages with [React Server Components](https://react.dev/reference/rsc/server-components), using the [official Notion API](https://developers.notion.com).

- **Content ships as HTML, not JavaScript.** Blocks render on the server to plain, semantic HTML (`p`, `h2`, `ul`, `figure`, `table`, …), so the renderer never reaches the browser. The only client code is the click-to-load player for embeds and react-tweet's few interactive parts of posts on X.
- **Code and math on the server.** Code blocks are highlighted with [Shiki](https://shiki.style) (light and dark themes), equations with [KaTeX](https://katex.org), both at render time.
- **Embeds without third-party cookies.** Players show a preview from oEmbed and load the iframe only when clicked. Posts on X use [react-tweet](https://react-tweet.vercel.app). Bookmarks show the linked page's title and description.
- **Fast first paint.** The lead image is loaded eagerly with `fetchpriority="high"`, the rest lazily.
- **Bring your own styles.** Works with Tailwind's `prose` or any typography CSS; a stylesheet covers the Notion-specific parts.

It needs React 19 and nothing else: no Next.js dependency. It works in any RSC framework (Next.js App Router, Waku, React Router, …) and with `react-dom/static` `prerender`.

## Compared with react-notion-x

[react-notion-x](https://github.com/NotionX/react-notion-x) renders data from Notion's private API with components that hydrate in the browser, in Notion's own look. This package renders the official API's block objects (`@notionhq/client`) with Server Components, so it works with an integration token, does not break when Notion changes its private API, and keeps the renderer, Shiki and KaTeX out of your JavaScript bundle; the HTML takes your site's typography. In exchange, it covers page content only: the official API does not expose database views. See the [full comparison](https://notion-kit-docs.vercel.app/docs#compared-with-react-notion-x).

## Install

```bash
npm install @yokinist/notion-rsc @notionhq/client
```

Works with `@notionhq/client` 5.x (Notion API version 2025-09-03, with data sources). CI tests the oldest and newest 5.x releases, and checks each new release weekly.

Shiki, KaTeX and react-tweet come with it.

## Usage

Fetch a page's blocks with their children, e.g. with [`@yokinist/notion-fetch`](https://github.com/yokinist/notion-kit/tree/main/packages/notion-fetch), and pass them to `<NotionBlocks>`:

```tsx
import { Client } from "@notionhq/client";
import { fetchBlockTree } from "@yokinist/notion-fetch";
import { NotionBlocks } from "@yokinist/notion-rsc";
import "@yokinist/notion-rsc/styles.css";

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
  // Passed to fetch for oEmbed, link previews and posts on X
  fetchInit={{ next: { revalidate: 86400 } }}
  // UI text
  labels={{ play: "再生" }}
  components={{
    Link: NextLink, // links to pages on your site
    Tweet: MyTweet, // replaces react-tweet
    callout: MyCallout, // any block type; see Styling
  }}
  // Classes for blocks of a type; see Styling
  classNames={{ callout: "rounded-xl p-4" }}
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

Every part of the output can be changed, from one color to the whole markup. Pick the level you need:

1. **Your typography.** The markup is the HTML you would write by hand, so styles such as Tailwind's [`prose`](https://github.com/tailwindlabs/tailwindcss-typography) cover most of it.
2. **Custom properties.** `@yokinist/notion-rsc/styles.css` styles the Notion-specific parts (and includes KaTeX's stylesheet). Its values are custom properties you can set on `:root`, or on any element to change one part of a page.
3. **Your CSS.** The stylesheet lives in the `components` [cascade layer](https://developer.mozilla.org/docs/Web/CSS/@layer), so any CSS of yours outside a layer overrides it, with no `!important` and no specificity fights.
4. **`classNames`.** Add classes to every block of a type, e.g. Tailwind utilities.
5. **`components`.** Render a block type with your own component.

### Custom properties

```css
:root {
  --notion-border: #e4e4e7; /* lines around cards */
  --notion-muted: #71717a; /* secondary text */
  --notion-hover: rgb(127 127 127 / 0.06); /* card hover */
  --notion-radius: 0.75rem; /* cards: callouts, bookmarks, players */
  --notion-radius-small: 0.5rem; /* code, images, artwork */
  --notion-space: 1.5rem; /* space above and below cards, code, equations */
  --notion-red: #dc2626; /* Notion's text colors: --notion-gray, -brown, -orange, -yellow, -green, -blue, -purple, -pink, -red */
}
```

### Classes and components

```tsx
<NotionBlocks
  blocks={blocks}
  classNames={{
    callout: "rounded-2xl bg-amber-50 p-6",
    code: "my-8",
  }}
  components={{
    // Any block type; you get the block, its rendered text and children
    callout: ({ block, text, children }) => (
      <aside className="note">
        {block.callout.icon?.type === "emoji" && block.callout.icon.emoji}
        <div>
          {text}
          {children}
        </div>
      </aside>
    ),
    bulleted_list_item: ({ text, children }) => (
      <li className="my-item">
        {text}
        {children}
      </li>
    ),
  }}
/>
```

`classNames` keeps the `notion-*` class and adds yours to the block's outer element. A component replaces the block entirely, including the `<li>` of a list item.

### With Tailwind

Import `styles.css` after your Tailwind CSS. Cascade layers are ordered by where they first appear, and Tailwind's import declares `theme, base, components, utilities`; the stylesheet then joins Tailwind's `components` layer, above preflight and below utilities, so classes from `classNames` win. Cards, code, embeds and the table of contents carry `not-prose`, so `prose` styles the writing around them, not their insides.

Without Tailwind, put your own base styles in a layer declared first (`@layer base, components;`) if they use element selectors like `img { height: auto }`, so they do not override the cards.

### Classes

| Class | Block |
| --- | --- |
| `notion-callout` | callout |
| `notion-to-do` | to-do item |
| `notion-columns` | column list |
| `notion-table` | table |
| `notion-table-of-contents` | table of contents |
| `notion-code` | code |
| `notion-equation` | block equation |
| `notion-image`, `notion-video`, `notion-audio` | image, video, audio |
| `notion-bookmark` | bookmark |
| `notion-embed` | embed player |
| `notion-color-*` | text colors, e.g. `notion-color-red`, `notion-color-red-background` |

Dark mode follows a `.dark` class on an ancestor, or `prefers-color-scheme` when there is none. If your site switches themes with a class and ignores the OS setting, also put `.light` on `<html>` in light mode, so dark-mode users of your light theme get light cards. The stylesheet also switches Shiki's `--shiki-light` / `--shiki-dark` colors the same way.

## Supported blocks

Paragraph, headings 1–3, bulleted / numbered lists, to-do, toggle, quote, callout, divider, code, equation, table, column list (side by side from 768px wide, at the widths set in Notion), table of contents, image, video, audio, file, PDF, bookmark, embed, link preview, synced blocks, and links to pages (child pages and link-to-page blocks, shown when `pageUrl` returns a path). Databases are skipped.

The official API does not give the width of an image resized in Notion, so images are shown at their own size, up to the width of the text. To make one narrower, put it in a column next to an empty one and drag the divider.

## Third-party software and trademarks

- Shiki, KaTeX (with its fonts) and react-tweet are installed from npm as dependencies under their own licenses: MIT, with a few of their dependencies under Apache-2.0, ISC and 0BSD. This package does not bundle them.
- Players and posts load from YouTube, Spotify, SoundCloud, Instagram and X under those services' terms. Titles and thumbnails come from their oEmbed endpoints and are linked, not copied.
- YouTube, Spotify, SoundCloud and X are trademarks of their owners. Their icons, from [Simple Icons](https://simpleicons.org) (CC0), are shown unaltered only to identify the service. This project is not affiliated with or endorsed by them.

## License

MIT
