import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";

/** A block with its nested blocks, as returned by fetchBlockTree. */
export type NotionBlock = BlockObjectResponse & { children?: NotionBlock[] };

export type RichText = RichTextItemResponse[];

export type NotionBlocksOptions = {
  /**
   * Path of a Notion page on your site, for links to it. Pages it returns
   * undefined for link to notion.so.
   */
  pageUrl?: (pageId: string) => string | undefined;
};

/** Resolved options passed down while rendering. */
export type Context = Required<NotionBlocksOptions>;
