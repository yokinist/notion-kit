import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
// After global.css, whose Tailwind import sets the layer order
import "./global.css";
import "@yokinist/notion-rsc/styles.css";
import { Inter } from "next/font/google";
import { siteUrl } from "@/lib/shared";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "notion-kit", template: "%s | notion-kit" },
  description:
    "Build sites on the official Notion API, rendered with React Server Components.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
