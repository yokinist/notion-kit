import { Bookmark } from "./Bookmark.js";
import { EmbedFacade } from "./EmbedFacade.js";
import { toEmbed } from "./embeds.js";
import { getLinkPreview, type LinkPreview } from "./linkPreview.js";
import type { Context } from "./types.js";

// Players' oEmbed endpoints give cleaner titles than page metadata, and
// YouTube serves scrapers a consent page instead
const OEMBED: Record<string, string> = {
  YouTube: "https://www.youtube.com/oembed?format=json&url=",
  SoundCloud: "https://soundcloud.com/oembed?format=json&url=",
  Spotify: "https://open.spotify.com/oembed?url=",
};

// YouTube's oEmbed thumbnail is 480x360 with black bars; most videos also
// have a sharp 16:9 one
const youtubeThumbnail = async (image: string, init: RequestInit) => {
  const maxres = image.replace(/\/hqdefault\.jpg$/, "/maxresdefault.jpg");
  if (maxres === image) return image;
  try {
    const response = await fetch(maxres, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
      ...init,
    });
    return response.ok ? maxres : image;
  } catch {
    return image;
  }
};

const playerPreview = async (
  provider: string,
  url: string,
  init: RequestInit,
): Promise<LinkPreview> => {
  const endpoint = OEMBED[provider];
  if (!endpoint) return getLinkPreview(url, init);
  try {
    const response = await fetch(endpoint + encodeURIComponent(url), {
      signal: AbortSignal.timeout(10_000),
      ...init,
    });
    if (!response.ok) return {};
    const data = (await response.json()) as {
      title?: string;
      thumbnail_url?: string;
    };
    const image =
      provider === "YouTube" && data.thumbnail_url
        ? await youtubeThumbnail(data.thumbnail_url, init)
        : data.thumbnail_url;
    return { title: data.title, image };
  } catch {
    // Private tracks have no oEmbed; their pages only have generic metadata
    return {};
  }
};

// Loaded only when a page has a post: react-tweet imports CSS modules,
// which need a bundler
const DefaultTweet = async ({ id }: { id: string }) => {
  const { Tweet } = await import("react-tweet");
  return <Tweet id={id} />;
};

const followRedirects = async (url: string, init: RequestInit) => {
  try {
    return (
      (await fetch(url, { signal: AbortSignal.timeout(10_000), ...init }))
        .url || url
    );
  } catch {
    return url;
  }
};

/** An embed or external video: a post on X, a player, or a link card. */
export const Embed = async ({ url, ctx }: { url: string; ctx: Context }) => {
  let pageUrl = url;
  let embed = toEmbed(url);
  if (embed.kind === "redirect") {
    pageUrl = await followRedirects(url, ctx.fetchInit);
    embed = toEmbed(pageUrl);
  }
  switch (embed.kind) {
    case "tweet": {
      const Tweet = ctx.components.Tweet ?? DefaultTweet;
      return (
        <div className="notion-tweet">
          <Tweet id={embed.id} />
        </div>
      );
    }
    case "player": {
      const { title, image } = await playerPreview(
        embed.provider,
        pageUrl,
        ctx.fetchInit,
      );
      return (
        <EmbedFacade
          src={embed.src}
          provider={embed.provider}
          height={embed.height}
          title={title}
          image={image}
          playLabel={ctx.labels.play}
        />
      );
    }
    default:
      return <Bookmark url={url} ctx={ctx} />;
  }
};
