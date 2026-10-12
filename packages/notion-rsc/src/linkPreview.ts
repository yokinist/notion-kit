export type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decode = (text: string) =>
  text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (!code.startsWith("#")) return ENTITIES[code.toLowerCase()] ?? match;
    const n =
      code[1]?.toLowerCase() === "x"
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10);
    return Number.isNaN(n) ? match : String.fromCodePoint(n);
  });

const meta = (html: string, names: string[]) => {
  for (const name of names) {
    const tag = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i"),
    )?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return decode(content.trim());
  }
};

/**
 * Title, description and image of a web page, from its Open Graph (or plain
 * HTML) metadata. The official Notion API only gives a bookmark's URL.
 * Returns {} when the page cannot be fetched.
 *
 * `init` is passed to fetch; with Next.js, `{ next: { revalidate: 86400 } }`
 * caches previews for a day.
 */
export const getLinkPreview = async (
  url: string,
  init: RequestInit = {},
): Promise<LinkPreview> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; link preview)" },
      ...init,
    });
    if (!response.ok) return {};
    const html = (await response.text()).slice(0, 200_000);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    return {
      title:
        meta(html, ["og:title", "twitter:title"]) ??
        (title ? decode(title) : undefined),
      description: meta(html, [
        "og:description",
        "twitter:description",
        "description",
      ]),
      image: meta(html, ["og:image", "twitter:image"]),
    };
  } catch {
    return {};
  }
};
