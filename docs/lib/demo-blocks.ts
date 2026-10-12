import type { NotionBlock } from "@yokinist/notion-rsc";

// A sample page in the shape fetchBlockTree returns, trimmed to the fields
// the renderer reads.

type Annotations = Partial<{
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}>;

const t = (content: string, annotations: Annotations = {}, href?: string) => ({
  type: "text",
  text: { content, link: href ? { url: href } : null },
  plain_text: content,
  href: href ?? null,
  annotations: {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: "default",
    ...annotations,
  },
});

let n = 0;
const b = (type: string, value: object, children?: NotionBlock[]) =>
  ({
    object: "block",
    id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
    type,
    has_children: Boolean(children),
    [type]: value,
    children,
  }) as unknown as NotionBlock;

const rich = (...rich_text: ReturnType<typeof t>[]) => ({
  rich_text,
  color: "default",
});

export const demoBlocks: NotionBlock[] = [
  b("table_of_contents", { color: "default" }),
  b("heading_1", rich(t("Text"))),
  b(
    "paragraph",
    rich(
      t("Rich text keeps its "),
      t("bold", { bold: true }),
      t(", "),
      t("italic", { italic: true }),
      t(", "),
      t("strikethrough", { strikethrough: true }),
      t(", "),
      t("inline code", { code: true }),
      t(", "),
      t("colors", { color: "red" }),
      t(", "),
      t("backgrounds", { color: "yellow_background" }),
      t(" and "),
      t("links", {}, "https://developers.notion.com"),
      t("."),
    ),
  ),
  b("quote", rich(t("Blocks become the HTML you would write by hand."))),
  b("callout", {
    ...rich(
      t(
        "Callouts keep their icon. Everything here was rendered on the server.",
      ),
    ),
    icon: { type: "emoji", emoji: "💡" },
  }),
  b("heading_2", rich(t("Lists"))),
  b("bulleted_list_item", rich(t("Consecutive items are grouped into a list"))),
  b("bulleted_list_item", rich(t("Items can nest")), [
    b("numbered_list_item", rich(t("Numbered inside bulleted"))),
    b("numbered_list_item", rich(t("And so on"))),
  ]),
  b("to_do", { ...rich(t("Render Notion pages")), checked: true }),
  b("to_do", {
    ...rich(t("Ship no client JavaScript for them")),
    checked: false,
  }),
  b("toggle", rich(t("Toggles become <details>")), [
    b("paragraph", rich(t("Hidden until opened, with no JavaScript."))),
  ]),
  b("heading_1", rich(t("Code and math"))),
  b("code", {
    rich_text: [
      t(`import { NotionBlocks } from "@yokinist/notion-rsc";

export default async function Page() {
  const blocks = await fetchBlockTree(notion, pageId);
  return <NotionBlocks blocks={blocks} />;
}`),
    ],
    language: "tsx",
    caption: [],
  }),
  b("equation", {
    expression: "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
  }),
  b("heading_1", rich(t("Layout"))),
  b(
    "table",
    { table_width: 3, has_column_header: true, has_row_header: true },
    [
      b("table_row", {
        cells: [[t("Block")], [t("Element")], [t("Client JS")]],
      }),
      b("table_row", { cells: [[t("Toggle")], [t("<details>")], [t("None")]] }),
      b("table_row", { cells: [[t("Code")], [t("<pre>")], [t("None")]] }),
      b("table_row", {
        cells: [[t("Video embed")], [t("<button>")], [t("Until clicked")]],
      }),
    ],
  ),
  b("column_list", {}, [
    b("column", {}, [
      b("paragraph", rich(t("Columns", { bold: true }))),
      b("paragraph", rich(t("Stack on small screens."))),
    ]),
    b("column", {}, [
      b("paragraph", rich(t("Side by side", { bold: true }))),
      b("paragraph", rich(t("From 768px wide."))),
    ]),
  ]),
  b("divider", {}),
  b("heading_1", rich(t("Media and embeds"))),
  b("image", {
    type: "external",
    external: { url: "/demo.svg" },
    caption: [t("Images get a caption from <figcaption>.")],
  }),
  b("bookmark", { url: "https://react.dev", caption: [] }),
  b("video", {
    type: "external",
    external: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    caption: [],
  }),
];
