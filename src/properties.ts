import type { PageObjectResponse } from "@notionhq/client";

export type PageProperty = PageObjectResponse["properties"][string];

/**
 * The value of a text-like property (title, rich text, select, status, url),
 * or undefined when it is empty.
 */
export const getPropertyText = (
  property: PageProperty | undefined,
): string | undefined => {
  switch (property?.type) {
    case "title":
      return property.title.map((t) => t.plain_text).join("") || undefined;
    case "rich_text":
      return property.rich_text.map((t) => t.plain_text).join("") || undefined;
    case "select":
      return property.select?.name;
    case "status":
      return property.status?.name;
    case "url":
      return property.url ?? undefined;
    default:
      return undefined;
  }
};

/** The option names of a multi-select property, or [] for other types. */
export const getPropertyNames = (
  property: PageProperty | undefined,
): string[] =>
  property?.type === "multi_select"
    ? property.multi_select.map((option) => option.name)
    : [];

/** The start of a date property (ISO 8601), or undefined when unset. */
export const getPropertyDate = (
  property: PageProperty | undefined,
): string | undefined =>
  property?.type === "date" ? property.date?.start : undefined;
