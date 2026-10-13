import { describe, expect, it } from "vitest";
import { NotionBlocks } from "./index.js";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

const rich = (content: string) => ({ rich_text: [text(content)] });
const withId = (b: object, id: string) => ({ ...(b as object), id }) as never;

describe("NotionBlocks customization", () => {
  it("adds classNames to a block's outer element, keeping its own class", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("paragraph", rich("Hello")), "p"),
          withId(block("callout", { ...rich("Note"), icon: null }), "c"),
          withId(
            block("code", {
              rich_text: [text("x")],
              language: "plain text",
              caption: [],
            }),
            "code",
          ),
        ]}
        classNames={{
          paragraph: "lead",
          callout: "rounded-xl p-4",
          code: "my-code",
        }}
      />,
    );

    expect(dom.querySelector("p")?.className).toBe("lead");
    expect(dom.querySelector(".notion-callout")?.className).toBe(
      "notion-callout rounded-xl p-4",
    );
    expect(
      dom.querySelector(".notion-code")?.classList.contains("my-code"),
    ).toBe(true);
  });

  it("renders a block type with your own component, given its text and children", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block(
              "callout",
              { ...rich("Heads up"), icon: { type: "emoji", emoji: "💡" } },
              {
                has_children: true,
                children: [withId(block("paragraph", rich("Inside")), "in")],
              },
            ),
            "c",
          ),
          withId(block("paragraph", rich("Untouched")), "p"),
        ]}
        components={{
          callout: ({ block, text, children }) => (
            <aside
              data-icon={
                block.callout.icon?.type === "emoji"
                  ? block.callout.icon.emoji
                  : ""
              }
            >
              <strong>{text}</strong>
              {children}
            </aside>
          ),
        }}
      />,
    );

    const aside = dom.querySelector("aside");
    expect(aside?.dataset.icon).toBe("💡");
    expect(aside?.querySelector("strong")?.textContent).toBe("Heads up");
    expect(aside?.querySelector("p")?.textContent).toBe("Inside");
    expect(dom.querySelector(".notion-callout")).toBeNull();
    expect(dom.querySelector(":scope > p")?.textContent).toBe("Untouched");
  });

  it("replaces list items, keeping them in their list", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("bulleted_list_item", rich("one")), "a"),
          withId(block("bulleted_list_item", rich("two")), "b"),
        ]}
        components={{
          bulleted_list_item: ({ text }) => <li className="item">{text}</li>,
        }}
      />,
    );

    const items = [...dom.querySelectorAll("ul > li.item")];
    expect(items.map((li) => li.textContent)).toEqual(["one", "two"]);
  });
});
