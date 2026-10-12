import { describe, expect, it } from "vitest";
import { NotionBlocks } from "./index.js";
import { block, text } from "./test/blocks.js";
import { renderToDom } from "./test/render.js";

const withId = (b: object, id: string) => ({ ...(b as object), id }) as never;
const uploaded = (url: string) => ({
  type: "file",
  file: { url, expiry_time: "" },
});
const external = (url: string) => ({ type: "external", external: { url } });

describe("NotionBlocks media", () => {
  it("renders images with captions, uploaded ones through fileUrl", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block("image", {
              ...uploaded("https://s3/signed"),
              caption: [text("A cat")],
            }),
            "img-1",
          ),
          withId(
            block("image", {
              ...external("https://cdn.example/dog.jpg"),
              caption: [],
            }),
            "img-2",
          ),
        ]}
        fileUrl={(id) => `/api/notion/file/${id}`}
      />,
    );

    const [cat, dog] = dom.querySelectorAll("figure");
    expect(cat?.querySelector("img")?.getAttribute("src")).toBe(
      "/api/notion/file/img-1",
    );
    expect(cat?.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(cat?.querySelector("figcaption")?.textContent).toBe("A cat");
    expect(dog?.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn.example/dog.jpg",
    );
    expect(dog?.querySelector("figcaption")).toBeNull();
  });

  it("uses Notion's own URL for uploaded files when no fileUrl is given", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block("image", { ...uploaded("https://s3/signed"), caption: [] }),
            "img",
          ),
        ]}
      />,
    );

    expect(dom.querySelector("img")?.getAttribute("src")).toBe(
      "https://s3/signed",
    );
  });

  it("loads an image among the first blocks eagerly and later ones lazily", async () => {
    const image = (id: string) =>
      withId(
        block("image", { ...external(`https://cdn/${id}.jpg`), caption: [] }),
        id,
      );
    const paragraph = (id: string) =>
      withId(block("paragraph", { rich_text: [text(id)] }), id);
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          paragraph("p1"),
          image("lead"),
          paragraph("p2"),
          paragraph("p3"),
          image("later"),
        ]}
      />,
    );

    const [lead, later] = dom.querySelectorAll("img");
    expect(lead?.getAttribute("loading")).toBe("eager");
    expect(lead?.getAttribute("fetchpriority")).toBe("high");
    expect(later?.getAttribute("loading")).toBe("lazy");
    expect(later?.hasAttribute("fetchpriority")).toBe(false);
  });

  it("renders uploaded video and audio as players, and files and PDFs as links", async () => {
    const dom = await renderToDom(
      <NotionBlocks
        blocks={[
          withId(
            block("video", { ...uploaded("https://s3/v"), caption: [] }),
            "video",
          ),
          withId(
            block("audio", { ...uploaded("https://s3/a"), caption: [] }),
            "audio",
          ),
          withId(
            block("file", {
              ...uploaded("https://s3/f"),
              caption: [],
              name: "slides.key",
            }),
            "file",
          ),
          withId(
            block("pdf", {
              ...uploaded("https://s3/p"),
              caption: [text("Report")],
            }),
            "pdf",
          ),
        ]}
        fileUrl={(id) => `/files/${id}`}
      />,
    );

    expect(dom.querySelector("video")?.getAttribute("src")).toBe(
      "/files/video",
    );
    expect(dom.querySelector("video")?.hasAttribute("controls")).toBe(true);
    expect(dom.querySelector("audio")?.getAttribute("src")).toBe(
      "/files/audio",
    );
    const links = [...dom.querySelectorAll("a")].map((a) => [
      a.getAttribute("href"),
      a.textContent,
    ]);
    expect(links).toEqual([
      ["/files/file", "slides.key"],
      ["/files/pdf", "Report"],
    ]);
  });
});
