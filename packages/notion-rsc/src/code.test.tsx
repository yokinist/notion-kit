import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NotionBlocks } from "./index.js";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

const code = (content: string, language: string) =>
  block("code", { rich_text: [text(content)], language, caption: [] });
const equation = (expression: string) => block("equation", { expression });

describe("NotionBlocks code and equations", () => {
  // As on Cloudflare Workers, which refuse to compile WebAssembly at runtime
  beforeAll(() => {
    const { CompileError } = WebAssembly;
    const refuse = () => {
      throw new CompileError("Wasm code generation disallowed");
    };
    vi.stubGlobal("WebAssembly", {
      ...WebAssembly,
      compile: refuse,
      instantiate: refuse,
    });
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("highlights code with Shiki, in both light and dark themes", async () => {
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("const a = 1;", "javascript")]} />,
    );

    const pre = dom.querySelector(".notion-code pre.shiki");
    expect(pre?.textContent).toBe("const a = 1;");
    expect(pre?.querySelector("span[style*='--shiki-dark']")).not.toBeNull();
  });

  it("colors SQL keywords", async () => {
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("SELECT * FROM posts", "sql")]} />,
    );

    const select = [...dom.querySelectorAll(".notion-code pre span")].find(
      (span) => span.textContent === "SELECT",
    );
    expect(select?.getAttribute("style")).toContain("--shiki-light:#D73A49");
  });

  it("falls back to plain text for languages Shiki does not know", async () => {
    const dom = await renderToDom(
      <NotionBlocks blocks={[code("hello", "plain text")]} />,
    );

    expect(dom.querySelector(".notion-code pre")?.textContent).toBe("hello");
  });

  it("renders block and inline equations with KaTeX", async () => {
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
});
