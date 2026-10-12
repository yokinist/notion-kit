import type { Client } from "@notionhq/client";
import { describe, expect, it } from "vitest";
import { queryDatabase } from "./index.js";

const page = (id: string) => ({
  object: "page",
  id,
  url: `https://www.notion.so/${id}`,
  properties: {},
});

// A client with one database whose single data source has `rows`
const fakeNotion = (rows: string[], pageSize = 100) =>
  ({
    databases: {
      retrieve: async () => ({
        object: "database",
        id: "db",
        data_sources: [{ id: "source", name: "Posts" }],
      }),
    },
    dataSources: {
      query: async ({
        data_source_id,
        start_cursor,
      }: {
        data_source_id: string;
        start_cursor?: string;
      }) => {
        if (data_source_id !== "source") throw new Error("unknown source");
        const start = start_cursor ? Number(start_cursor) : 0;
        const next = start + pageSize < rows.length ? start + pageSize : null;
        return {
          object: "list",
          results: rows.slice(start, start + pageSize).map(page),
          has_more: next !== null,
          next_cursor: next === null ? null : String(next),
        };
      },
    },
  }) as unknown as Client;

describe("queryDatabase", () => {
  it("returns every row of the database's data source", async () => {
    const rows = await queryDatabase(fakeNotion(["a", "b", "c"], 2), "db");

    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("says so when the ID is not a database with a data source", async () => {
    const notion = {
      databases: { retrieve: async () => ({ object: "database", id: "db" }) },
    } as unknown as Client;

    await expect(queryDatabase(notion, "db")).rejects.toThrow(
      "db has no data source",
    );
  });
});
