import { afterEach, describe, expect, it, vi } from "vitest";
import { NotionBlocks } from "./index.js";
import { block } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

// Answers fetch by URL prefix; anything else fails like the network would
const serve = (routes: Record<string, () => Response>) => {
  const fetch = vi.fn(async (url: string) => {
    const route = Object.keys(routes).find((prefix) =>
      String(url).startsWith(prefix),
    );
    if (!route) throw new Error(`unexpected fetch ${url}`);
    return routes[route]?.() as Response;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
};
const html = (body: string) => () => new Response(body);
const json = (data: object) => () => Response.json(data);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotionBlocks bookmarks and embeds", () => {
  it("renders bookmarks as cards with the page's title, description and image", async () => {
    serve({
      "https://example.com/post": html(
        `<meta property="og:title" content="A post"><meta property="og:description" content="About it"><meta property="og:image" content="https://example.com/cover.png">`,
      ),
    });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("bookmark", { url: "https://example.com/post", caption: [] }),
        ]}
      />,
    );

    const card = dom.querySelector("a.notion-bookmark");
    expect(card?.getAttribute("href")).toBe("https://example.com/post");
    expect(card?.querySelector(".notion-bookmark-title")?.textContent).toBe(
      "A post",
    );
    expect(
      card?.querySelector(".notion-bookmark-description")?.textContent,
    ).toBe("About it");
    expect(card?.querySelector(".notion-bookmark-host")?.textContent).toBe(
      "example.com",
    );
    expect(card?.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.com/cover.png",
    );
  });

  it("shows players as a card with the oEmbed title, not an iframe", async () => {
    const fetch = serve({
      "https://open.spotify.com/oembed": json({
        title: "Weightless",
        thumbnail_url: "https://i.scdn.co/cover.jpg",
      }),
    });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("embed", {
            url: "https://open.spotify.com/album/9x",
            caption: [],
          }),
        ]}
        fetchInit={{ cache: "force-cache" }}
      />,
    );

    expect(dom.querySelector("iframe")).toBeNull();
    const card = dom.querySelector("button.notion-embed");
    expect(card?.getAttribute("aria-label")).toBe("Play: Weightless");
    expect(card?.querySelector("img")?.getAttribute("src")).toBe(
      "https://i.scdn.co/cover.jpg",
    );
    expect(card?.textContent).toContain("Spotify");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://open.spotify.com/oembed?url="),
      expect.objectContaining({ cache: "force-cache" }),
    );
  });

  it("follows SoundCloud short links and embeds YouTube videos", async () => {
    serve({
      "https://on.soundcloud.com/AbC": () =>
        Object.assign(new Response(""), {
          url: "https://soundcloud.com/artist/track",
        }),
      "https://soundcloud.com/oembed": json({ title: "A track" }),
      "https://www.youtube.com/oembed": json({ title: "A video" }),
    });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block(
            "embed",
            { url: "https://on.soundcloud.com/AbC", caption: [] },
            { id: "sc" },
          ),
          block(
            "video",
            {
              type: "external",
              external: { url: "https://youtu.be/abc" },
              caption: [],
            },
            { id: "yt" },
          ),
        ]}
        labels={{ play: "再生する" }}
      />,
    );

    const labels = [...dom.querySelectorAll("button.notion-embed")].map((b) =>
      b.getAttribute("aria-label"),
    );
    expect(labels).toEqual(["再生する: A track", "再生する: A video"]);
  });

  it("shows YouTube's high-resolution thumbnail when the video has one", async () => {
    const hq = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const maxres = (id: string) =>
      `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    serve({
      "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fyoutu.be%2Fnew":
        json({ title: "New", thumbnail_url: hq("new") }),
      "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fyoutu.be%2Fold":
        json({ title: "Old", thumbnail_url: hq("old") }),
      [maxres("new")]: () => new Response(""),
      [maxres("old")]: () => new Response("", { status: 404 }),
    });
    const video = (id: string) =>
      block(
        "video",
        {
          type: "external",
          external: { url: `https://youtu.be/${id}` },
          caption: [],
        },
        { id },
      );
    const dom = await renderToDom(
      <NotionBlocks blocks={[video("new"), video("old")]} />,
    );

    const images = [...dom.querySelectorAll("button.notion-embed img")].map(
      (img) => img.getAttribute("src"),
    );
    expect(images).toEqual([maxres("new"), hq("old")]);
  });

  it("shows the artist and track like SoundCloud's own player", async () => {
    serve({
      "https://soundcloud.com/oembed": json({
        title: "Flickermood by Forss",
        author_name: "Forss",
      }),
    });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block("embed", {
            url: "https://soundcloud.com/forss/flickermood",
            caption: [],
          }),
        ]}
      />,
    );

    const card = dom.querySelector("button.notion-embed");
    expect(card?.querySelector(".notion-embed-author")?.textContent).toBe(
      "Forss",
    );
    expect(card?.querySelector(".notion-embed-title")?.textContent).toBe(
      "Flickermood",
    );
    // Same height as the player, so loading it does not move the page
    expect((card as HTMLElement | null)?.style.height).toBe("166px");
  });

  it("renders posts on X with the Tweet component and other embeds as bookmarks", async () => {
    serve({ "https://bandcamp.example": html("<title>An album</title>") });
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          block(
            "embed",
            { url: "https://x.com/someone/status/42", caption: [] },
            { id: "x" },
          ),
          block(
            "embed",
            { url: "https://bandcamp.example/album", caption: [] },
            { id: "bc" },
          ),
        ]}
        components={{ Tweet: ({ id }) => <blockquote data-tweet={id} /> }}
      />,
    );

    expect(dom.querySelector("[data-tweet]")?.getAttribute("data-tweet")).toBe(
      "42",
    );
    expect(dom.querySelector(".notion-bookmark-title")?.textContent).toBe(
      "An album",
    );
  });
});
