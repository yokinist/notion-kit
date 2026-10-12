import type { RichTextItemResponse } from "@notionhq/client";
import { Fragment } from "react";
import type { Context, RichText as RichTextValue } from "./types.js";

const withLineBreaks = (text: string) =>
  text.split("\n").map((line, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: lines of a static string
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));

// Links to other Notion pages come as "/<page id>"
const notionPageId = (href: string) => href.match(/^\/([\da-f]{32})/)?.[1];

const Link = ({
  href,
  ctx,
  children,
}: {
  href: string;
  ctx: Context;
  children: React.ReactNode;
}) => {
  const pageId = notionPageId(href);
  const path = pageId && ctx.pageUrl(pageId);
  if (path) return <a href={path}>{children}</a>;
  return (
    <a
      href={pageId ? `https://www.notion.so/${pageId}` : href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  );
};

const Item = ({ item, ctx }: { item: RichTextItemResponse; ctx: Context }) => {
  const { bold, italic, strikethrough, underline, code, color } =
    item.annotations;
  let node: React.ReactNode = withLineBreaks(item.plain_text);
  if (code) node = <code>{node}</code>;
  if (bold) node = <strong>{node}</strong>;
  if (italic) node = <em>{node}</em>;
  if (strikethrough) node = <s>{node}</s>;
  if (underline) node = <u>{node}</u>;
  // gray, red_background, ... -> .notion-color-gray, .notion-color-red-background
  if (color !== "default") {
    node = (
      <span className={`notion-color-${color.replace("_", "-")}`}>{node}</span>
    );
  }
  if (item.href) {
    node = (
      <Link href={item.href} ctx={ctx}>
        {node}
      </Link>
    );
  }
  return node;
};

export const RichText = ({
  text,
  ctx,
}: {
  text: RichTextValue;
  ctx: Context;
}) =>
  text.map((item, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: rich text segments have no id
    <Item key={i} item={item} ctx={ctx} />
  ));
