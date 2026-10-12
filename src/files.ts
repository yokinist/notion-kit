import type { Client } from "@notionhq/client";
import type { RequestLimiter } from "./limiter";

export type FileHandlerOptions = {
  notion: Client;
  /**
   * How long the CDN may cache the redirect. Notion's signed URLs expire
   * after an hour, so keep this well below that.
   */
  cacheSeconds?: number;
  limit?: RequestLimiter;
};

const MEDIA_TYPES = new Set(["image", "video", "audio", "file", "pdf"]);

// Notion IDs are 32 hex digits, with or without dashes
const BLOCK_ID =
  /^[\da-f]{8}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{4}-?[\da-f]{12}$/i;

const notFound = () => new Response("Not found", { status: 404 });

type Media =
  | { type: "file"; file: { url: string } }
  | { type: "external"; external: { url: string } };

/**
 * A request handler that redirects /<path>/<block id> to a fresh URL of the
 * file in that block. Files uploaded to Notion get signed URLs that expire
 * after an hour, so pages link here instead of to the file itself.
 *
 * With Next.js: `export const GET = createFileHandler({ notion })` in
 * app/api/notion/file/[id]/route.ts.
 */
export const createFileHandler = ({
  notion,
  cacheSeconds = 2400,
  limit = (send) => send(),
}: FileHandlerOptions) => {
  return async (request: Request): Promise<Response> => {
    const id = new URL(request.url).pathname.split("/").pop() ?? "";
    if (!BLOCK_ID.test(id)) return notFound();
    const block = (await limit(() =>
      notion.blocks.retrieve({ block_id: id }),
    ).catch(() => undefined)) as
      | (Record<string, unknown> & { type?: string })
      | undefined;
    if (!block?.type || !MEDIA_TYPES.has(block.type)) return notFound();
    const media = block[block.type] as Media;
    const url = media.type === "file" ? media.file.url : media.external.url;
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Cache-Control": `public, max-age=0, s-maxage=${cacheSeconds}`,
      },
    });
  };
};
