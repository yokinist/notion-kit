import { cx } from "./cx.js";
import { getLinkPreview } from "./linkPreview.js";
import type { Context } from "./types.js";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** A link card with the page's own title, description and image. */
export const Bookmark = async ({
  url,
  ctx,
  className,
}: {
  url: string;
  ctx: Context;
  className?: string;
}) => {
  const { title, description, image } = await getLinkPreview(
    url,
    ctx.fetchInit,
  );
  return (
    <a
      className={cx("notion-bookmark not-prose", className)}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
    >
      <span className="notion-bookmark-text">
        <span className="notion-bookmark-title">{title || url}</span>
        {description && (
          <span className="notion-bookmark-description">{description}</span>
        )}
        <span className="notion-bookmark-host">{hostOf(url)}</span>
      </span>
      {image && (
        <img
          className="notion-bookmark-image"
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          // Some sites refuse images linked from other sites
          referrerPolicy="no-referrer"
        />
      )}
    </a>
  );
};
