import type { RichTextItemResponse } from "@notionhq/client";
import { Fragment } from "react";
import { Equation } from "./Equation.js";
import type { Context, RichText as RichTextValue } from "./types.js";

const withLineBreaks = (text: string) =>
  text.split("\n").map((line, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: lines of a static string
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));

/** A link to a page on your site, through components.Link if given. */
export const InternalLink = ({
  href,
  ctx,
  children,
}: {
  href: string;
  ctx: Context;
  children: React.ReactNode;
}) => {
  const Link = ctx.components.Link;
  return Link ? (
    <Link href={href}>{children}</Link>
  ) : (
    <a href={href}>{children}</a>
  );
};

const NOTION_HOST = /(^|\.)notion\.(so|site|com)$/;

// The page a link points to: a page mention carries its ID, and links to
// Notion pages come as "/<id>" or as a notion.so / app.notion.com URL
const notionPageId = (item: RichTextItemResponse, href: string) => {
  if (item.type === "mention" && item.mention.type === "page") {
    return item.mention.page.id.replaceAll("-", "");
  }
  const relative = href.match(/^\/([\da-f]{32})/)?.[1];
  if (relative) return relative;
  try {
    const url = new URL(href);
    if (!NOTION_HOST.test(url.hostname)) return undefined;
    return url.pathname.match(/([\da-f]{32})$/)?.[1];
  } catch {
    return undefined;
  }
};

const Link = ({
  href,
  pageId,
  ctx,
  children,
}: {
  href: string;
  pageId: string | undefined;
  ctx: Context;
  children: React.ReactNode;
}) => {
  const path = pageId && ctx.pageUrl(pageId);
  if (path)
    return (
      <InternalLink href={path} ctx={ctx}>
        {children}
      </InternalLink>
    );
  return (
    <a
      href={
        href.startsWith("/") && pageId
          ? `https://www.notion.so/${pageId}`
          : href
      }
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
  let node: React.ReactNode =
    item.type === "equation" ? (
      <Equation expression={item.equation.expression} />
    ) : (
      withLineBreaks(item.plain_text)
    );
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
      <Link href={item.href} pageId={notionPageId(item, item.href)} ctx={ctx}>
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
