import { afterEach, describe, expect, it, vi } from "vitest";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

const code = (content: string, language: string) =>
  block("code", { rich_text: [text(content)], language, caption: [] });
const equation = (expression: string) => block("equation", { expression });

afterEach(() => {
  vi.doUnmock("shiki");
  vi.doUnmock("katex");
  vi.resetModules();
});

describe("NotionBlocks code and equations", () => {
  it("highlights code with Shiki, in both light and dark themes", async () => {
    const { NotionBlocks } = await import("./index.js");
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("const a = 1;", "javascript")]} />,
    );

    const pre = dom.querySelector(".notion-code pre.shiki");
    expect(pre?.textContent).toBe("const a = 1;");
    expect(pre?.querySelector("span[style*='--shiki-dark']")).not.toBeNull();
  });

  it("falls back to plain text for languages Shiki does not know", async () => {
    const { NotionBlocks } = await import("./index.js");
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("hello", "plain text")]} />,
    );

    expect(dom.querySelector(".notion-code pre")?.textContent).toBe("hello");
  });

  it("renders plain <pre><code> when Shiki is not installed", async () => {
    vi.doMock("shiki", () => {
      throw new Error("Cannot find package 'shiki'");
    });
    const { NotionBlocks } = await import("./index.js");
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("x <y>", "javascript")]} />,
    );

    expect(dom.querySelector(".notion-code pre code")?.textContent).toBe(
      "x <y>",
    );
  });

  it("renders block and inline equations with KaTeX", async () => {
    const { NotionBlocks } = await import("./index.js");
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          equation("E = mc^2"),
          block("paragraph", {
            rich_text: [
              {
                ...text("a^2"),
                type: "equation",
                equation: { expression: "a^2" },
              },
            ],
          }),
        ]}
      />,
    );

    expect(dom.querySelector(".notion-equation .katex-display")).not.toBeNull();
    expect(dom.querySelector("p .katex")).not.toBeNull();
  });

  it("shows the TeX source when KaTeX is not installed", async () => {
    vi.doMock("katex", () => {
      throw new Error("Cannot find package 'katex'");
    });
    const { NotionBlocks } = await import("./index.js");
    const dom = await renderToDom(
      <NotionBlocks blocks={[equation("E = mc^2")]} />,
    );

    expect(dom.querySelector(".notion-equation code")?.textContent).toBe(
      "E = mc^2",
    );
  });
});
