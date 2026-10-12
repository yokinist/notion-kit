import { createFileRoute } from "@tanstack/react-router";
import { createFileHandler } from "@yokinist/notion-fetch";
import { limit, notion } from "#/lib/notion";

// Files uploaded to Notion get URLs that expire after an hour. Pages link
// here instead, and this redirects to a fresh one.
const handleFile = createFileHandler({ notion, limit });

export const Route = createFileRoute("/api/notion/file/$id")({
  server: { handlers: { GET: ({ request }) => handleFile(request) } },
});
