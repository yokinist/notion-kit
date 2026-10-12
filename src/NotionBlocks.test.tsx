import { describe, expect, it } from "vitest";
import { NotionBlocks } from "./index.js";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

describe("NotionBlocks", () => {
  it("renders paragraphs with bold text and links", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("paragraph", {
            rich_text: [
              text("Read "),
              text("this", {
                href: "https://example.com",
                annotations: { ...text("").annotations, bold: true },
              }),
            ],
          }),
        ]}
      />,
    );

    const paragraph = dom.querySelector("p");
    expect(paragraph?.textContent).toBe("Read this");
    const link = paragraph?.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.querySelector("strong")?.textContent).toBe("this");
  });

  it("renders the other text annotations, colors and line breaks", async () => {
    const on = (annotation: object) => ({
      annotations: { ...text("").annotations, ...annotation },
    });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("paragraph", {
            rich_text: [
              text("italic", on({ italic: true })),
              text("struck", on({ strikethrough: true })),
              text("under", on({ underline: true })),
              text("npm i", on({ code: true })),
              text("muted", on({ color: "gray" })),
              text("line 1\nline 2"),
            ],
          }),
        ]}
      />,
    );

    expect(dom.querySelector("em")?.textContent).toBe("italic");
    expect(dom.querySelector("s")?.textContent).toBe("struck");
    expect(dom.querySelector("u")?.textContent).toBe("under");
    expect(dom.querySelector("code")?.textContent).toBe("npm i");
    expect(dom.querySelector(".notion-color-gray")?.textContent).toBe("muted");
    expect(dom.querySelectorAll("p br")).toHaveLength(1);
  });

  it("opens external links in a new tab", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("paragraph", {
            rich_text: [text("site", { href: "https://example.com" })],
          }),
        ]}
      />,
    );

    const link = dom.querySelector("a");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noreferrer noopener");
  });

  it("maps links to Notion pages with pageUrl", async () => {
    const known = "0123456789abcdef0123456789abcdef";
    const unknown = "fedcba9876543210fedcba9876543210";
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("paragraph", {
            rich_text: [
              text("known", { href: `/${known}` }),
              text("unknown", { href: `/${unknown}` }),
            ],
          }),
        ]}
        pageUrl={(id) => (id === known ? "/posts/hello" : undefined)}
      />,
    );

    const [internal, fallback] = dom.querySelectorAll("a");
    expect(internal?.getAttribute("href")).toBe("/posts/hello");
    expect(internal?.hasAttribute("target")).toBe(false);
    expect(fallback?.getAttribute("href")).toBe(
      `https://www.notion.so/${unknown}`,
    );
  });
});
