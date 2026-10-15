import {
  type Client,
  collectPaginatedAPI,
  isFullPage,
  type PageObjectResponse,
} from "@notionhq/client";
import type { FetchOptions } from "./blocks.js";

/** Fetches every row of a database (its first data source). */
export const queryDatabase = async (
  notion: Client,
  databaseId: string,
  { limit = (send) => send() }: FetchOptions = {},
): Promise<PageObjectResponse[]> => {
  const database = await limit(() =>
    notion.databases.retrieve({ database_id: databaseId }),
  );
  const dataSourceId =
    "data_sources" in database ? database.data_sources[0]?.id : undefined;
  if (!dataSourceId) throw new Error(`${databaseId} has no data source`);
  const rows = await collectPaginatedAPI(
    (args: Parameters<Client["dataSources"]["query"]>[0]) =>
      limit(() => notion.dataSources.query(args)),
    { data_source_id: dataSourceId },
  );
  return rows.filter(isFullPage);
};
