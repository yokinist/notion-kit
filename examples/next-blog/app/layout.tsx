import "./styles.css";
import "@yokinist/notion-rsc/styles.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "notion-kit blog", template: "%s | notion-kit blog" },
  description: "A blog written in Notion and rendered with notion-kit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header>
          <Link href="/">notion-kit blog</Link>
        </header>
        <main>{children}</main>
        <footer>
          Written in Notion, rendered with{" "}
          <a href="https://github.com/yokinist/notion-kit">notion-kit</a>.
        </footer>
      </body>
    </html>
  );
}
