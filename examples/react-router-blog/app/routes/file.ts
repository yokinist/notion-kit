import { createFileHandler } from "@yokinist/notion-fetch";
import { limit, notion } from "~/lib/notion";
import type { Route } from "./+types/file";

// Files uploaded to Notion get URLs that expire after an hour. Pages link
// here instead, and this redirects to a fresh one.
const handleFile = createFileHandler({ notion, limit });

export function loader({ request }: Route.LoaderArgs) {
  return handleFile(request);
}
