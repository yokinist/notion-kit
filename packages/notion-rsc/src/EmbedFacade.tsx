"use client";

import { useState } from "react";

export type EmbedFacadeProps = {
  src: string;
  provider: string;
  height?: number;
  title?: string;
  image?: string;
  playLabel: string;
};

/**
 * Players (Spotify, YouTube, ...) set third-party cookies and weigh hundreds
 * of KB, so this shows a card and loads the player only when asked to.
 */
export const EmbedFacade = ({
  src,
  provider,
  height,
  title,
  image,
  playLabel,
}: EmbedFacadeProps) => {
  const [active, setActive] = useState(false);
  if (active) {
    return (
      <iframe
        className="notion-embed-player"
        src={provider === "YouTube" ? `${src}?autoplay=1` : src}
        title={title ?? provider}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        style={height ? { height } : { aspectRatio: "16 / 9" }}
      />
    );
  }
  // Players without a fixed height are videos: show them as one
  const video = !height;
  return (
    <button
      type="button"
      className={video ? "notion-embed notion-embed-video" : "notion-embed"}
      onClick={() => setActive(true)}
      aria-label={`${playLabel}: ${title ?? provider}`}
    >
      {image && (
        <img className="notion-embed-image" src={image} alt="" loading="lazy" />
      )}
      <span className="notion-embed-text">
        <span className="notion-embed-provider">{provider}</span>
        <span className="notion-embed-title">{title ?? provider}</span>
      </span>
      <span className="notion-embed-play">
        {video ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
          </svg>
        ) : (
          playLabel
        )}
      </span>
    </button>
  );
};
