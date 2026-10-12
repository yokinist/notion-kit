import {
  type BlockObjectResponse,
  type Client,
  collectPaginatedAPI,
  isFullBlock,
} from "@notionhq/client";
import type { RequestLimiter } from "./limiter.js";

/** A block with its nested blocks (list items, toggles, columns, ...). */
export type NotionBlock = BlockObjectResponse & { children?: NotionBlock[] };

export type FetchOptions = {
  /** Sends requests through a limiter, e.g. createRequestLimiter(). */
  limit?: RequestLimiter;
};

const unlimited: RequestLimiter = (send) => send();

/** Fetches a page's content, with nested blocks under `children`. */
export const fetchBlockTree = async (
  notion: Client,
  blockId: string,
  { limit = unlimited }: FetchOptions = {},
): Promise<NotionBlock[]> => {
  const results = await limit(() =>
    collectPaginatedAPI(notion.blocks.children.list, { block_id: blockId }),
  );
  const blocks = results.filter(isFullBlock);
  return Promise.all(
    blocks.map(async (block) =>
      // Child pages and databases are separate pages, not this page's content
      block.has_children &&
      block.type !== "child_page" &&
      block.type !== "child_database"
        ? {
            ...block,
            children: await fetchBlockTree(notion, block.id, { limit }),
          }
        : block,
    ),
  );
};
