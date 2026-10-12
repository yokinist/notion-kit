import { afterEach, describe, expect, it, vi } from "vitest";
import { getLinkPreview } from "./index.js";

const serve = (body: string, status = 200) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLinkPreview", () => {
  it("reads the Open Graph title, description and image", async () => {
    serve(`<html><head>
      <meta property="og:title" content="Tom &amp; Jerry&#39;s &#x2014; Blog" />
      <meta content="Notes on cats" property="og:description">
      <meta property="og:image" content="https://cdn.example/cover.png" />
    </head></html>`);

    await expect(getLinkPreview("https://example.com")).resolves.toEqual({
      title: "Tom & Jerry's — Blog",
      description: "Notes on cats",
      image: "https://cdn.example/cover.png",
    });
  });

  it("falls back to <title> and the description meta tag", async () => {
    serve(
      `<title> Plain page </title><meta name="description" content="Just HTML">`,
    );

    await expect(getLinkPreview("https://example.com")).resolves.toEqual({
      title: "Plain page",
      description: "Just HTML",
      image: undefined,
    });
  });

  it("resolves a relative image against the page's URL", async () => {
    serve(`<meta property="og:image" content="/images/cover.png">`);

    const { image } = await getLinkPreview("https://example.com/posts/1");
    expect(image).toBe("https://example.com/images/cover.png");
  });

  it("returns nothing when the page cannot be fetched", async () => {
    serve("Not found", 404);
    await expect(getLinkPreview("https://example.com")).resolves.toEqual({});

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    await expect(getLinkPreview("https://example.com")).resolves.toEqual({});
  });
});
