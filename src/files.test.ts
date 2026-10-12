import type { Client } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";
import { createFileHandler } from "./index";

const ID = "9a3fab18-6b4a-44f8-8228-34ce66a4fc88";

const fakeNotion = (block: object | Error) =>
  ({
    blocks: {
      retrieve: vi.fn(async () => {
        if (block instanceof Error) throw block;
        return { object: "block", id: ID, has_children: false, ...block };
      }),
    },
  }) as unknown as Client;

const get = (handler: (request: Request) => Promise<Response>, id = ID) =>
  handler(new Request(`https://example.com/api/notion/file/${id}`));

describe("createFileHandler", () => {
  it("redirects to a fresh URL of a file uploaded to Notion", async () => {
    const handler = createFileHandler({
      notion: fakeNotion({
        type: "image",
        image: { type: "file", file: { url: "https://s3.example/signed" } },
      }),
    });

    const response = await get(handler);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://s3.example/signed");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, s-maxage=2400",
    );
  });

  it("redirects external media to its URL", async () => {
    const handler = createFileHandler({
      notion: fakeNotion({
        type: "video",
        video: { type: "external", external: { url: "https://youtu.be/x" } },
      }),
    });

    const response = await get(handler);

    expect(response.headers.get("Location")).toBe("https://youtu.be/x");
  });

  it("answers 404 for an ID that is not a block ID, without asking Notion", async () => {
    const notion = fakeNotion({ type: "image" });
    const handler = createFileHandler({ notion });

    const response = await get(handler, "..%2Fsecret");

    expect(response.status).toBe(404);
    expect(notion.blocks.retrieve).not.toHaveBeenCalled();
  });

  it("answers 404 for blocks without a file", async () => {
    const handler = createFileHandler({
      notion: fakeNotion({ type: "paragraph", paragraph: { rich_text: [] } }),
    });

    expect((await get(handler)).status).toBe(404);
  });

  it("answers 404 when Notion cannot find the block", async () => {
    const handler = createFileHandler({
      notion: fakeNotion(new Error("object_not_found")),
    });

    expect((await get(handler)).status).toBe(404);
  });
});
