import type { Client } from "@notionhq/client";
import { describe, expect, it } from "vitest";
import { createRequestLimiter, fetchBlockTree } from "./index";

type FakeBlock = { id: string; type: string; has_children?: boolean };

// A Notion client whose blocks.children.list serves pages of a fake tree
const fakeNotion = (children: Record<string, FakeBlock[]>, pageSize = 100) =>
  ({
    blocks: {
      children: {
        list: async ({
          block_id,
          start_cursor,
        }: {
          block_id: string;
          start_cursor?: string;
        }) => {
          const all = children[block_id] ?? [];
          const start = start_cursor ? Number(start_cursor) : 0;
          const page = all.slice(start, start + pageSize);
          const next = start + pageSize < all.length ? start + pageSize : null;
          return {
            object: "list",
            results: page.map((block) => ({
              object: "block",
              has_children: false,
              [block.type]: {},
              ...block,
            })),
            has_more: next !== null,
            next_cursor: next === null ? null : String(next),
          };
        },
      },
    },
  }) as unknown as Client;

const ids = (blocks: { id: string; children?: unknown[] }[]): unknown =>
  blocks.map((block) =>
    block.children
      ? { [block.id]: ids(block.children as { id: string }[]) }
      : block.id,
  );

describe("fetchBlockTree", () => {
  it("returns the page's blocks with nested blocks under children", async () => {
    const notion = fakeNotion({
      page: [
        { id: "intro", type: "paragraph" },
        { id: "list", type: "bulleted_list_item", has_children: true },
      ],
      list: [{ id: "nested", type: "paragraph" }],
    });

    const blocks = await fetchBlockTree(notion, "page");

    expect(ids(blocks)).toEqual(["intro", { list: ["nested"] }]);
  });

  it("follows pagination to get every block", async () => {
    const notion = fakeNotion(
      {
        page: [
          { id: "a", type: "paragraph" },
          { id: "b", type: "paragraph" },
          { id: "c", type: "paragraph" },
        ],
      },
      2,
    );

    expect(ids(await fetchBlockTree(notion, "page"))).toEqual(["a", "b", "c"]);
  });

  it("does not descend into child pages and databases", async () => {
    const notion = fakeNotion({
      page: [
        { id: "subpage", type: "child_page", has_children: true },
        { id: "db", type: "child_database", has_children: true },
      ],
      subpage: [{ id: "inside-subpage", type: "paragraph" }],
      db: [{ id: "row", type: "paragraph" }],
    });

    expect(ids(await fetchBlockTree(notion, "page"))).toEqual([
      "subpage",
      "db",
    ]);
  });

  it("sends every request through the given limiter", async () => {
    const notion = fakeNotion({
      page: [
        { id: "a", type: "toggle", has_children: true },
        { id: "b", type: "toggle", has_children: true },
        { id: "c", type: "toggle", has_children: true },
      ],
      a: [{ id: "a1", type: "paragraph" }],
      b: [{ id: "b1", type: "paragraph" }],
      c: [{ id: "c1", type: "paragraph" }],
    });
    const list = notion.blocks.children.list;
    let inFlight = 0;
    let maxInFlight = 0;
    notion.blocks.children.list = (async (args: never) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;
      return list(args);
    }) as typeof list;

    await fetchBlockTree(notion, "page", {
      limit: createRequestLimiter({ concurrency: 1 }),
    });

    expect(maxInFlight).toBe(1);
  });
});
