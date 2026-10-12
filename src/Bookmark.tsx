import { getLinkPreview } from "./linkPreview.js";
import type { Context } from "./types.js";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** A link card with the page's own title and description. */
export const Bookmark = async ({ url, ctx }: { url: string; ctx: Context }) => {
  const { title, description } = await getLinkPreview(url, ctx.fetchInit);
  return (
    <a
      className="notion-bookmark"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <span className="notion-bookmark-title">{title || url}</span>
      {description && (
        <span className="notion-bookmark-description">{description}</span>
      )}
      <span className="notion-bookmark-host">{hostOf(url)}</span>
    </a>
  );
};
