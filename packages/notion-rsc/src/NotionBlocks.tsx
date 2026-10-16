import {
  type ComponentType,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";
import { Bookmark } from "./Bookmark.js";
import { Code } from "./Code.js";
import { cx } from "./cx.js";
import { Embed } from "./Embed.js";
import { Equation } from "./Equation.js";
import { InternalLink, RichText } from "./RichText.js";
import type {
  BlockComponentProps,
  Context,
  Heading,
  NotionBlock,
  NotionBlocksOptions,
  RichText as RichTextValue,
} from "./types.js";

const plain = (text: { plain_text: string }[]) =>
  text.map((t) => t.plain_text).join("");

const notionId = (id: string) => id.replaceAll("-", "");

type Media =
  | { type: "file"; file: { url: string } }
  | { type: "external"; external: { url: string } };

const mediaUrl = (blockId: string, media: Media, ctx: Context) =>
  media.type === "external" ? media.external.url : ctx.fileUrl(blockId);

type Group =
  | { kind: "block"; block: NotionBlock }
  | { kind: "list"; ordered: boolean; items: NotionBlock[] };

// Notion lists are separate items; group consecutive ones into <ul>/<ol>
const groupLists = (blocks: NotionBlock[]) =>
  blocks.reduce<Group[]>((groups, block) => {
    const ordered = block.type === "numbered_list_item";
    if (block.type !== "bulleted_list_item" && !ordered) {
      groups.push({ kind: "block", block });
      return groups;
    }
    const last = groups[groups.length - 1];
    if (last?.kind === "list" && last.ordered === ordered)
      last.items.push(block);
    else groups.push({ kind: "list", ordered, items: [block] });
    return groups;
  }, []);

const Children = ({ block, ctx }: { block: NotionBlock; ctx: Context }) =>
  block.children ? <Blocks blocks={block.children} ctx={ctx} /> : null;

// The default element for a block, before classNames and components apply
const renderBlock = (block: NotionBlock, ctx: Context): ReactNode => {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <RichText text={block.paragraph.rich_text} ctx={ctx} />
        </p>
      );
    // The page title is the <h1>, so Notion headings start at <h2>
    case "heading_1":
      return (
        <h2 id={block.id}>
          <RichText text={block.heading_1.rich_text} ctx={ctx} />
        </h2>
      );
    case "heading_2":
      return (
        <h3 id={block.id}>
          <RichText text={block.heading_2.rich_text} ctx={ctx} />
        </h3>
      );
    case "heading_3":
      return (
        <h4 id={block.id}>
          <RichText text={block.heading_3.rich_text} ctx={ctx} />
        </h4>
      );
    case "quote":
      return (
        <blockquote>
          <RichText text={block.quote.rich_text} ctx={ctx} />
          <Children block={block} ctx={ctx} />
        </blockquote>
      );
    case "callout":
      return (
        <div className="notion-callout">
          {block.callout.icon?.type === "emoji" && (
            <span className="notion-callout-icon" aria-hidden>
              {block.callout.icon.emoji}
            </span>
          )}
          <div className="notion-callout-content">
            <RichText text={block.callout.rich_text} ctx={ctx} />
            <Children block={block} ctx={ctx} />
          </div>
        </div>
      );
    case "divider":
      return <hr />;
    case "toggle":
      return (
        <details>
          <summary>
            <RichText text={block.toggle.rich_text} ctx={ctx} />
          </summary>
          <Children block={block} ctx={ctx} />
        </details>
      );
    case "to_do":
      return (
        <div className="notion-to-do">
          <input type="checkbox" checked={block.to_do.checked} readOnly />
          <div>
            <RichText text={block.to_do.rich_text} ctx={ctx} />
            <Children block={block} ctx={ctx} />
          </div>
        </div>
      );
    case "table": {
      const rows = (block.children ?? []).filter(
        (row) => row.type === "table_row",
      );
      const { has_column_header, has_row_header } = block.table;
      const [head, ...rest] = rows;
      const body = has_column_header ? rest : rows;
      const cells = (row: NotionBlock | undefined, header: boolean) =>
        row?.type === "table_row"
          ? row.table_row.cells.map((cell, i) => {
              const rowHeader = !header && i === 0 && has_row_header;
              const Cell = header || rowHeader ? "th" : "td";
              return (
                <Cell
                  // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no id
                  key={i}
                  scope={header ? "col" : rowHeader ? "row" : undefined}
                >
                  <RichText text={cell} ctx={ctx} />
                </Cell>
              );
            })
          : null;
      return (
        <div className="notion-table">
          <table>
            {has_column_header && (
              <thead>
                <tr>{cells(head, true)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((row) => (
                <tr key={row.id}>{cells(row, false)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "column_list": {
      // Widths set by dragging in Notion; the CSS uses them from 768px wide
      const ratios = (block.children ?? []).map((column) =>
        column.type === "column" ? column.column.width_ratio : undefined,
      );
      const style = ratios.some((ratio) => ratio !== undefined)
        ? ({
            "--notion-columns": ratios
              .map((ratio) => `minmax(0, ${ratio ?? 1 / ratios.length}fr)`)
              .join(" "),
          } as CSSProperties)
        : undefined;
      return (
        <div className="notion-columns" style={style}>
          {block.children?.map((column) => (
            <div key={column.id} className="notion-column">
              <Children block={column} ctx={ctx} />
            </div>
          ))}
        </div>
      );
    }
    case "table_of_contents":
      return (
        <nav className="notion-table-of-contents not-prose">
          <ul>
            {ctx.headings.map((heading) => (
              <li key={heading.id} data-level={heading.level}>
                <a href={`#${heading.id}`}>{heading.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      );
    case "synced_block":
      return <Children block={block} ctx={ctx} />;
    case "link_to_page": {
      const target = block.link_to_page;
      const path =
        target.type === "page_id"
          ? ctx.pageUrl(notionId(target.page_id))
          : undefined;
      return path ? (
        <p>
          <InternalLink href={path} ctx={ctx}>
            {path}
          </InternalLink>
        </p>
      ) : null;
    }
    case "child_page": {
      const path = ctx.pageUrl(notionId(block.id));
      return path ? (
        <p>
          <InternalLink href={path} ctx={ctx}>
            {block.child_page.title}
          </InternalLink>
        </p>
      ) : null;
    }
    case "image": {
      const lead = block.id === ctx.leadImageId;
      return (
        <figure className="notion-image">
          <img
            src={mediaUrl(block.id, block.image, ctx)}
            // Notion has no alt text; a caption is read from <figcaption>
            alt=""
            loading={lead ? "eager" : "lazy"}
            fetchPriority={lead ? "high" : undefined}
            decoding="async"
          />
          {block.image.caption.length > 0 && (
            <figcaption>
              <RichText text={block.image.caption} ctx={ctx} />
            </figcaption>
          )}
        </figure>
      );
    }
    case "video":
      return block.video.type === "file" ? (
        // biome-ignore lint/a11y/useMediaCaption: Notion has no captions track
        <video
          className="notion-video"
          controls
          preload="metadata"
          src={mediaUrl(block.id, block.video, ctx)}
        />
      ) : (
        <Embed url={block.video.external.url} ctx={ctx} />
      );
    case "audio":
      return (
        // biome-ignore lint/a11y/useMediaCaption: Notion has no captions track
        <audio
          className="notion-audio"
          controls
          preload="metadata"
          src={mediaUrl(block.id, block.audio, ctx)}
        />
      );
    case "file":
    case "pdf": {
      const media = block.type === "file" ? block.file : block.pdf;
      const name =
        plain(media.caption) ||
        (block.type === "file" ? block.file.name : "") ||
        block.type.toUpperCase();
      return (
        <p className="notion-file">
          <a
            href={mediaUrl(block.id, media, ctx)}
            target="_blank"
            rel="noreferrer"
          >
            {name}
          </a>
        </p>
      );
    }
    case "code":
      return (
        <Code
          code={plain(block.code.rich_text)}
          language={block.code.language}
        />
      );
    case "equation":
      return <Equation expression={block.equation.expression} block />;
    case "bookmark":
      return <Bookmark url={block.bookmark.url} ctx={ctx} />;
    case "link_preview":
      return <Bookmark url={block.link_preview.url} ctx={ctx} />;
    case "embed":
      return <Embed url={block.embed.url} ctx={ctx} />;
    default:
      return null;
  }
};

const textOf = (block: NotionBlock): RichTextValue | undefined =>
  (block as unknown as Record<string, { rich_text?: RichTextValue }>)[
    block.type
  ]?.rich_text;

// Your component for the block's type, if any, with its text and children
const custom = (block: NotionBlock, ctx: Context) => {
  const Component = ctx.components[block.type] as
    | ComponentType<BlockComponentProps>
    | undefined;
  if (!Component) return undefined;
  const text = textOf(block);
  return (
    <Component
      key={block.id}
      block={block}
      text={text && <RichText text={text} ctx={ctx} />}
    >
      {block.children && <Blocks blocks={block.children} ctx={ctx} />}
    </Component>
  );
};

const Block = ({ block, ctx }: { block: NotionBlock; ctx: Context }) => {
  const replaced = custom(block, ctx);
  if (replaced) return replaced;
  const node = renderBlock(block, ctx);
  const className = ctx.classNames[block.type];
  if (!className || !isValidElement<{ className?: string }>(node)) return node;
  return cloneElement(node, { className: cx(node.props.className, className) });
};

const LEVELS = { heading_1: 1, heading_2: 2, heading_3: 3 } as const;

const headingsOf = (blocks: NotionBlock[]): Heading[] =>
  blocks.flatMap((block): Heading[] => {
    if (block.type === "heading_1")
      return [
        {
          id: block.id,
          level: LEVELS[block.type],
          text: plain(block.heading_1.rich_text),
        },
      ];
    if (block.type === "heading_2")
      return [
        {
          id: block.id,
          level: LEVELS[block.type],
          text: plain(block.heading_2.rich_text),
        },
      ];
    if (block.type === "heading_3")
      return [
        {
          id: block.id,
          level: LEVELS[block.type],
          text: plain(block.heading_3.rich_text),
        },
      ];
    return [];
  });

const listItemText = (item: NotionBlock) =>
  item.type === "bulleted_list_item"
    ? item.bulleted_list_item.rich_text
    : item.type === "numbered_list_item"
      ? item.numbered_list_item.rich_text
      : [];

const Blocks = ({ blocks, ctx }: { blocks: NotionBlock[]; ctx: Context }) =>
  groupLists(blocks).map((group) => {
    if (group.kind === "block") {
      return <Block key={group.block.id} block={group.block} ctx={ctx} />;
    }
    const List = group.ordered ? "ol" : "ul";
    return (
      <List key={group.items[0]?.id}>
        {group.items.map(
          (item) =>
            custom(item, ctx) ?? (
              <li key={item.id} className={ctx.classNames[item.type]}>
                <RichText text={listItemText(item)} ctx={ctx} />
                <Children block={item} ctx={ctx} />
              </li>
            ),
        )}
      </List>
    );
  });

export type NotionBlocksProps = NotionBlocksOptions & { blocks: NotionBlock[] };

/** Renders Notion blocks (from fetchBlockTree) as HTML. */
export const NotionBlocks = ({
  blocks,
  pageUrl = () => undefined,
  fileUrl,
  fetchInit = {},
  labels = {},
  components = {},
  classNames = {},
}: NotionBlocksProps) => {
  // Without a fileUrl, fall back to Notion's own (expiring) URLs
  const ownUrls = fileUrl ? {} : uploadedUrls(blocks);
  const ctx: Context = {
    pageUrl,
    fileUrl: fileUrl ?? ((id) => ownUrls[id] ?? ""),
    fetchInit,
    labels: { play: labels.play ?? "Play" },
    components,
    classNames,
    headings: headingsOf(blocks),
    leadImageId: blocks.slice(0, 3).find((block) => block.type === "image")?.id,
  };
  return <Blocks blocks={blocks} ctx={ctx} />;
};

// block id -> Notion's signed URL, for every uploaded file in the tree
const uploadedUrls = (blocks: NotionBlock[]): Record<string, string> =>
  Object.fromEntries(
    blocks.flatMap((block): [string, string][] => {
      const value = (block as unknown as Record<string, Media | undefined>)[
        block.type
      ];
      const own: [string, string][] =
        value?.type === "file" ? [[block.id, value.file.url]] : [];
      return [...own, ...Object.entries(uploadedUrls(block.children ?? []))];
    }),
  );
