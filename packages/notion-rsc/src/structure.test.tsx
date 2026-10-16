import { describe, expect, it } from "vitest";
import { NotionBlocks } from "./index.js";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

const rich = (content: string) => ({ rich_text: [text(content)] });
const withId = (b: object, id: string) => ({ ...(b as object), id }) as never;

describe("NotionBlocks structure", () => {
  it("renders headings from <h2>, since the page title is the <h1>, with ids", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("heading_1", rich("One")), "h-1"),
          block("heading_2", rich("Two")),
          block("heading_3", rich("Three")),
        ]}
      />,
    );

    expect(dom.querySelector("h2")?.textContent).toBe("One");
    expect(dom.querySelector("h2")?.id).toBe("h-1");
    expect(dom.querySelector("h3")?.textContent).toBe("Two");
    expect(dom.querySelector("h4")?.textContent).toBe("Three");
  });

  it("groups consecutive list items into lists, with nested items", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("bulleted_list_item", rich("a")), "a"),
          withId(
            block("bulleted_list_item", rich("b"), {
              has_children: true,
              children: [
                withId(block("numbered_list_item", rich("b.1")), "b1"),
              ],
            }),
            "b",
          ),
          withId(block("paragraph", rich("between")), "p"),
          withId(block("numbered_list_item", rich("first")), "n1"),
          withId(block("numbered_list_item", rich("second")), "n2"),
        ]}
      />,
    );

    const lists = [...dom.children].filter((el) =>
      /^(UL|OL)$/.test(el.tagName),
    );
    expect(lists.map((list) => list.tagName)).toEqual(["UL", "OL"]);
    expect(lists[0]?.querySelectorAll(":scope > li")).toHaveLength(2);
    expect(lists[0]?.querySelector("li ol li")?.textContent).toBe("b.1");
    expect(lists[1]?.textContent).toBe("firstsecond");
  });

  it("renders quotes, callouts, dividers, toggles and to-dos", async () => {
    const nested = [withId(block("paragraph", rich("inside")), "inside")];
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("quote", rich("Said someone")), "q"),
          withId(
            block("callout", {
              ...rich("Heads up"),
              icon: { type: "emoji", emoji: "💡" },
            }),
            "c",
          ),
          withId(block("divider", {}), "d"),
          withId(
            block("toggle", rich("More"), {
              has_children: true,
              children: nested,
            }),
            "t",
          ),
          withId(block("to_do", { ...rich("Done"), checked: true }), "todo"),
        ]}
      />,
    );

    expect(dom.querySelector("blockquote")?.textContent).toBe("Said someone");
    const callout = dom.querySelector(".notion-callout");
    expect(callout?.querySelector(".notion-callout-icon")?.textContent).toBe(
      "💡",
    );
    expect(callout?.textContent).toContain("Heads up");
    expect(dom.querySelector("hr")).not.toBeNull();
    expect(dom.querySelector("details summary")?.textContent).toBe("More");
    expect(dom.querySelector("details p")?.textContent).toBe("inside");
    const checkbox = dom.querySelector<HTMLInputElement>(".notion-to-do input");
    expect(checkbox?.checked).toBe(true);
    expect(dom.querySelector(".notion-to-do")?.textContent).toBe("Done");
  });

  it("renders tables with column and row headers", async () => {
    const row = (id: string, ...cells: string[]) =>
      withId(block("table_row", { cells: cells.map((c) => [text(c)]) }), id);
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block(
              "table",
              { table_width: 2, has_column_header: true, has_row_header: true },
              {
                has_children: true,
                children: [row("r0", "", "2026"), row("r1", "Goal", "Rest")],
              },
            ),
            "table",
          ),
        ]}
      />,
    );

    expect(
      [...dom.querySelectorAll("thead th")].map((th) => th.textContent),
    ).toEqual(["", "2026"]);
    const bodyRow = dom.querySelector("tbody tr");
    expect(bodyRow?.querySelector("th[scope=row]")?.textContent).toBe("Goal");
    expect(bodyRow?.querySelector("td")?.textContent).toBe("Rest");
  });

  it("renders columns, a table of contents, synced blocks and links to pages", async () => {
    const column = (id: string, content: string) =>
      withId(
        block(
          "column",
          {},
          {
            has_children: true,
            children: [withId(block("paragraph", rich(content)), `${id}-p`)],
          },
        ),
        id,
      );
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(block("table_of_contents", {}), "toc"),
          withId(block("heading_1", rich("Intro")), "intro"),
          withId(
            block(
              "column_list",
              {},
              {
                has_children: true,
                children: [column("left", "L"), column("right", "R")],
              },
            ),
            "columns",
          ),
          withId(
            block(
              "synced_block",
              { synced_from: null },
              {
                has_children: true,
                children: [withId(block("paragraph", rich("synced")), "s-p")],
              },
            ),
            "synced",
          ),
          withId(
            block("link_to_page", {
              type: "page_id",
              page_id: "0123456789abcdef0123456789abcdef",
            }),
            "ltp",
          ),
          withId(
            block("child_page", { title: "Child" }),
            "fedcba98-7654-3210-fedc-ba9876543210",
          ),
        ]}
        pageUrl={(id) =>
          ({
            "0123456789abcdef0123456789abcdef": "/about",
            fedcba9876543210fedcba9876543210: "/child",
          })[id]
        }
      />,
    );

    const toc = dom.querySelector(".notion-table-of-contents a");
    expect(toc?.getAttribute("href")).toBe("#intro");
    expect(toc?.textContent).toBe("Intro");
    expect(
      [...dom.querySelectorAll(".notion-column")].map((c) => c.textContent),
    ).toEqual(["L", "R"]);
    expect(dom.textContent).toContain("synced");
    expect(dom.querySelector('a[href="/about"]')).not.toBeNull();
    expect(dom.querySelector('a[href="/child"]')?.textContent).toBe("Child");
    // Columns without a width ratio share the width equally
    expect(dom.querySelector(".notion-columns")?.getAttribute("style")).toBe(
      null,
    );
  });

  it("keeps the widths of columns resized in Notion", async () => {
    const column = (id: string, width_ratio: number) =>
      withId(
        block(
          "column",
          { width_ratio },
          {
            has_children: true,
            children: [withId(block("paragraph", rich(id)), `${id}-p`)],
          },
        ),
        id,
      );
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block(
              "column_list",
              {},
              {
                has_children: true,
                children: [column("image", 0.6), column("empty", 0.4)],
              },
            ),
            "columns",
          ),
        ]}
      />,
    );

    const columns = dom.querySelector<HTMLElement>(".notion-columns");
    expect(columns?.style.getPropertyValue("--notion-columns")).toBe(
      "minmax(0, 0.6fr) minmax(0, 0.4fr)",
    );
  });
});
