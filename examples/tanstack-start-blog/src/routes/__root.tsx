import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "notion-kit blog" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => <h1>Not found</h1>,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <Link to="/">notion-kit blog</Link>
        </header>
        <main>{children}</main>
        <footer>
          Written in Notion, rendered with{" "}
          <a href="https://github.com/yokinist/notion-kit">notion-kit</a>.
        </footer>
        <Scripts />
      </body>
    </html>
  );
}
