# notion-kit

Build sites on the [official Notion API](https://developers.notion.com), with React Server Components.

| Package | |
| --- | --- |
| [`@yokinist/notion-fetch`](packages/notion-fetch) | Fetch pages and database rows without hitting rate limits, and serve uploaded files from URLs that do not expire. No framework needed. |
| [`@yokinist/notion-rsc`](packages/notion-rsc) | Render Notion blocks to HTML on the server, with Shiki, KaTeX and click-to-load embeds. Needs only React 19. |

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
