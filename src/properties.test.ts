import type { PageObjectResponse } from "@notionhq/client";
import { describe, expect, it } from "vitest";
import { getPropertyDate, getPropertyNames, getPropertyText } from "./index";

type Property = PageObjectResponse["properties"][string];
const property = (value: object) => value as Property;
const text = (...parts: string[]) =>
  parts.map((plain_text) => ({ plain_text }));

describe("getPropertyText", () => {
  it("joins the plain text of title and rich text properties", () => {
    expect(
      getPropertyText(
        property({ type: "title", title: text("Hello, ", "world") }),
      ),
    ).toBe("Hello, world");
    expect(
      getPropertyText(
        property({ type: "rich_text", rich_text: text("my-slug") }),
      ),
    ).toBe("my-slug");
  });

  it("reads select, status and url properties as their value", () => {
    expect(
      getPropertyText(property({ type: "select", select: { name: "Post" } })),
    ).toBe("Post");
    expect(
      getPropertyText(
        property({ type: "status", status: { name: "Published" } }),
      ),
    ).toBe("Published");
    expect(
      getPropertyText(property({ type: "url", url: "https://example.com" })),
    ).toBe("https://example.com");
    expect(getPropertyText(property({ type: "select", select: null }))).toBe(
      undefined,
    );
  });
});

describe("getPropertyNames", () => {
  it("lists the option names of a multi-select property", () => {
    expect(
      getPropertyNames(
        property({
          type: "multi_select",
          multi_select: [{ name: "tech" }, { name: "music" }],
        }),
      ),
    ).toEqual(["tech", "music"]);
    expect(getPropertyNames(property({ type: "title", title: [] }))).toEqual(
      [],
    );
  });
});

describe("getPropertyDate", () => {
  it("returns the start of a date property", () => {
    expect(
      getPropertyDate(
        property({ type: "date", date: { start: "2024-03-01", end: null } }),
      ),
    ).toBe("2024-03-01");
    expect(getPropertyDate(property({ type: "date", date: null }))).toBe(
      undefined,
    );
  });
});
