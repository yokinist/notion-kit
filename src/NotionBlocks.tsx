import { RichText } from "./RichText.js";
import type {
  Context,
  Heading,
  NotionBlock,
  NotionBlocksOptions,
} from "./types.js";

const plain = (text: { plain_text: string }[]) =>
  text.map((t) => t.plain_text).join("");

const notionId = (id: string) => id.replaceAll("-", "");

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

const Block = ({ block, ctx }: { block: NotionBlock; ctx: Context }) => {
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
    case "column_list":
      return (
        <div className="notion-columns">
          {block.children?.map((column) => (
            <div key={column.id} className="notion-column">
              <Children block={column} ctx={ctx} />
            </div>
          ))}
        </div>
      );
    case "table_of_contents":
      return (
        <nav className="notion-table-of-contents">
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
          <a href={path}>{path}</a>
        </p>
      ) : null;
    }
    case "child_page": {
      const path = ctx.pageUrl(notionId(block.id));
      return path ? (
        <p>
          <a href={path}>{block.child_page.title}</a>
        </p>
      ) : null;
    }
    default:
      return null;
  }
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
        {group.items.map((item) => (
          <li key={item.id}>
            <RichText text={listItemText(item)} ctx={ctx} />
            <Children block={item} ctx={ctx} />
          </li>
        ))}
      </List>
    );
  });

export type NotionBlocksProps = NotionBlocksOptions & { blocks: NotionBlock[] };

/** Renders Notion blocks (from fetchBlockTree) as HTML. */
export const NotionBlocks = ({
  blocks,
  pageUrl = () => undefined,
}: NotionBlocksProps) => (
  <Blocks blocks={blocks} ctx={{ pageUrl, headings: headingsOf(blocks) }} />
);
