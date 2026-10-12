# notion-kit

Two npm packages for building sites on the official Notion API, plus their docs site.

- `packages/notion-fetch` (`@yokinist/notion-fetch`): rate-limited requests, block trees, database rows, property helpers, and a `Request → Response` handler that redirects to fresh URLs of uploaded files. No React, no framework.
- `packages/notion-rsc` (`@yokinist/notion-rsc`): renders blocks with React Server Components. Shiki, KaTeX and react-tweet are dependencies; `EmbedFacade.tsx` is the only `"use client"` file. `src/styles.css` ships as `@yokinist/notion-rsc/styles.css`.
- `docs`: Fumadocs + Next.js, deployed on Vercel (root directory `docs`) at https://notion-kit-docs.vercel.app. The demo page renders `docs/lib/demo-blocks.ts`, so it needs no Notion token.

## Commands

```bash
npm ci
npm run lint        # Biome, whole repo
npm run build       # packages first, then docs
npm run typecheck   # docs needs the packages built
npm test            # Vitest in each package
npm run dev -w docs # docs and demo at localhost:3000
```

## Conventions

- Test first, through each package's public exports; mock only the Notion client and `fetch`. Fixtures in `packages/notion-rsc/src/test/`.
- Relative imports end in `.js` so the emitted types resolve under `nodenext`.
- `@notionhq/client` is a peer at `^5.0.0`; CI also tests 5.0.0 and the latest release.
- Check visual changes in the docs demo, in light and dark, at desktop and phone widths, and show screenshots before pushing.
- Keep README.md in each package and the matching page in `docs/content/docs` in sync.
- One commit per coherent change.

## Releasing

1. Bump `version` in the package's `package.json` and push to `main`.
2. Run the Publish workflow (`gh workflow run publish.yml`). It stages each version not yet on npm with `npm stage publish` through trusted publishing, with provenance.
3. A maintainer approves it in Staged Packages on npmjs.com.
4. Then create the tag and release on the commit that was published: `gh release create "@yokinist/notion-rsc@x.y.z" --target <sha> --latest`.
