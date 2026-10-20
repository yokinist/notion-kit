import { Client } from "@notionhq/client";
import {
  createRequestLimiter,
  createTimeoutFetch,
  getPropertyDate,
  getPropertyNames,
  getPropertyText,
  queryDatabase,
} from "@yokinist/notion-fetch";
import { cache } from "react";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  // Aborts a request whose response stalls, so it is retried
  fetch: createTimeoutFetch(),
  // Workers define WorkerGlobalScope, so the client takes them for a browser
  // and refuses the token. This code runs only on the server.
  dangerouslyAllowBrowser: true,
});

// One per isolate: keeps requests under Notion's rate limit
export const limit = createRequestLimiter();

export type Post = {
  id: string;
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  tags: string[];
};

// Every row of the database, newest first. cache(): a page and its
// metadata share one query per request.
export const getPosts = cache(async (): Promise<Post[]> => {
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId) {
    throw new Error("Set NOTION_TOKEN and NOTION_DATABASE_ID in .env.local");
  }
  const rows = await queryDatabase(notion, databaseId, { limit });
  return rows
    .map((row) => {
      const props = row.properties;
      const title = Object.values(props).find((p) => p.type === "title");
      return {
        id: row.id,
        slug: getPropertyText(props.slug) ?? row.id,
        title: getPropertyText(title) ?? "Untitled",
        date: getPropertyDate(props.date),
        summary: getPropertyText(props.summary),
        tags: getPropertyNames(props.tags),
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
});
