import { createFileHandler } from "@yokinist/notion-fetch";
import { limit, notion } from "@/lib/notion";

// Files uploaded to Notion get URLs that expire after an hour. Pages link
// here instead, and this redirects to a fresh one.
export const GET = createFileHandler({ notion, limit });
