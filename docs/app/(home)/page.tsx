import Link from "next/link";

const packages = [
  {
    name: "@yokinist/notion-fetch",
    href: "/docs/notion-fetch",
    text: "Fetch pages and database rows without hitting rate limits, and serve uploaded files from URLs that do not expire.",
  },
  {
    name: "@yokinist/notion-rsc",
    href: "/docs/notion-rsc",
    text: "Render Notion blocks to HTML on the server, with Shiki, KaTeX and click-to-load embeds.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-4 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight">notion-kit</h1>
        <p className="text-lg text-fd-muted-foreground">
          Build sites on the official Notion API, rendered with React Server
          Components. Your content ships as HTML, not JavaScript.
        </p>
        <div className="flex gap-3">
          <Link
            href="/docs/getting-started"
            className="rounded-full bg-fd-primary px-5 py-2 font-medium text-fd-primary-foreground"
          >
            Get started
          </Link>
          <Link
            href="/docs/demo"
            className="rounded-full border px-5 py-2 font-medium"
          >
            See the demo
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => (
          <Link
            key={pkg.name}
            href={pkg.href}
            className="rounded-xl border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
          >
            <p className="font-mono text-sm font-semibold">{pkg.name}</p>
            <p className="mt-2 text-sm text-fd-muted-foreground">{pkg.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
