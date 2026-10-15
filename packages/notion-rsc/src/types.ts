import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";
import type { ComponentType, ReactNode } from "react";

/** A block with its nested blocks, as returned by fetchBlockTree. */
export type NotionBlock = BlockObjectResponse & { children?: NotionBlock[] };

export type RichText = RichTextItemResponse[];

/** A Notion block type: "paragraph", "callout", "code", ... */
export type BlockType = NotionBlock["type"];

/** What a component that renders a block type receives. */
export type BlockComponentProps<T extends BlockType = BlockType> = {
  /** The block as the API returns it. */
  block: Extract<NotionBlock, { type: T }>;
  /** The block's rich text, rendered; for blocks that have text. */
  text?: ReactNode;
  /** The block's nested blocks, rendered. */
  children?: ReactNode;
};

/** Your own components for block types, e.g. { callout: MyCallout }. */
export type BlockComponents = {
  [T in BlockType]?: ComponentType<BlockComponentProps<T>>;
};

export type NotionBlocksOptions = {
  /**
   * Path of a Notion page on your site, for links to it. Pages it returns
   * undefined for link to notion.so.
   */
  pageUrl?: (pageId: string) => string | undefined;
  /**
   * URL for a file uploaded to Notion. Notion's own URLs expire after an
   * hour, so point this at a route that redirects to a fresh one, e.g.
   * createFileHandler from @yokinist/notion-fetch.
   */
  fileUrl?: (blockId: string) => string;
  /** Passed to fetch for link previews, oEmbed and posts on X, e.g. Next.js caching. */
  fetchInit?: RequestInit;
  /** Text in the UI, for translation. */
  labels?: { play?: string };
  /**
   * Replace how some content is rendered: links, posts on X, and any block
   * type, keyed by its Notion type (e.g. `callout`, `bulleted_list_item`).
   */
  components?: {
    /** A link to a page on your site, e.g. next/link. Defaults to <a>. */
    Link?: ComponentType<{ href: string; children: ReactNode }>;
    /** A post on X. Defaults to react-tweet's <Tweet>. */
    Tweet?: ComponentType<{ id: string }>;
  } & BlockComponents;
  /**
   * Classes to add to blocks of a type, on their outermost element, e.g.
   * `{ callout: "rounded-xl p-4" }`. The notion-* classes stay.
   */
  classNames?: Partial<Record<BlockType, string>>;
};

export type Heading = { id: string; level: 1 | 2 | 3; text: string };

/** Resolved options passed down while rendering. */
export type Context = Required<
  Pick<
    NotionBlocksOptions,
    "pageUrl" | "fileUrl" | "fetchInit" | "components" | "classNames"
  >
> & {
  labels: { play: string };
  // Headings of the top-level blocks, for table_of_contents
  headings: Heading[];
  // The image likely to be the largest contentful paint
  leadImageId: string | undefined;
};
