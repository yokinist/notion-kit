import { Client } from "@notionhq/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRequestLimiter,
  createTimeoutFetch,
  fetchBlockTree,
} from "./index.js";

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

  it("retries a response that stalls, without refetching the pages it already has", async () => {
    vi.useFakeTimers();
    // Headers arrive, then the body never finishes: the client's own
    // timeoutMs only covers the headers
    const stalled = () =>
      new Response(new ReadableStream({ start: () => {} }), { status: 200 });
    const page = (id: string, next: string | null) =>
      Response.json({
        object: "list",
        results: [
          {
            object: "block",
            id,
            type: "paragraph",
            paragraph: { rich_text: [] },
            has_children: false,
          },
        ],
        has_more: next !== null,
        next_cursor: next,
      });
    const requested: string[] = [];
    const notion = new Client({
      auth: "test",
      fetch: async (url) => {
        const cursor = new URL(url).searchParams.get("start_cursor") ?? "first";
        requested.push(cursor);
        if (cursor === "first") return page("a", "second");
        return requested.length === 2 ? stalled() : page("b", null);
      },
    });

    const blocks = fetchBlockTree(notion, "page", {
      limit: createRequestLimiter({ concurrency: 1, timeoutMs: 30_000 }),
    });
    await vi.advanceTimersByTimeAsync(32_000);
    vi.useRealTimers();

    expect(ids(await blocks)).toEqual(["a", "b"]);
    expect(requested).toEqual(["first", "second", "second"]);
  });

  describe("with createTimeoutFetch", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("aborts a stalled response and retries it as a new request", async () => {
      // Next.js shares identical GETs within a render unless they carry a
      // signal, so without one a retry would get the same stalled response
      const signals: (AbortSignal | undefined)[] = [];
      vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
        signals.push(init?.signal ?? undefined);
        if (signals.length > 1)
          return Response.json({
            object: "list",
            results: [],
            has_more: false,
            next_cursor: null,
          });
        // Like undici: aborting errors the body that is being read
        const body = new ReadableStream({
          start: (controller) =>
            init?.signal?.addEventListener("abort", () =>
              controller.error(init.signal?.reason),
            ),
        });
        return new Response(body, { status: 200 });
      });
      const notion = new Client({
        auth: "test",
        fetch: createTimeoutFetch({ timeoutMs: 20 }),
      });

      const blocks = await fetchBlockTree(notion, "page", {
        limit: createRequestLimiter({ concurrency: 1 }),
      });

      expect(blocks).toEqual([]);
      expect(signals).toHaveLength(2);
      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]).toBeInstanceOf(AbortSignal);
    });
  });
});
