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
  /**
   * URL for a file uploaded to Notion. Notion's own URLs expire after an
   * hour, so point this at a route that redirects to a fresh one, e.g.
   * createFileHandler from @yokinist/notion-kit.
   */
  fileUrl?: (blockId: string) => string;
};

export type Heading = { id: string; level: 1 | 2 | 3; text: string };

/** Resolved options passed down while rendering. */
export type Context = Required<NotionBlocksOptions> & {
  // Headings of the top-level blocks, for table_of_contents
  headings: Heading[];
  // The image likely to be the largest contentful paint
  leadImageId: string | undefined;
};
