import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "@yokinist/notion-rsc/styles.css";
import "./global.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

// Vercel sets this to the production domain
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
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
