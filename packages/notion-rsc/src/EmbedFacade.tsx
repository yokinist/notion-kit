"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { cx } from "./cx.js";

export type EmbedFacadeProps = {
  src: string;
  provider: string;
  height?: number;
  title?: string;
  author?: string;
  image?: string;
  playLabel: string;
  /** Added to the card and to the player once it loads. */
  className?: string;
};

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
);

// Brand icons, unaltered, from Simple Icons (CC0): https://simpleicons.org
const SpotifyLogo = () => (
  <svg className="notion-embed-logo" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      fill="currentColor"
    />
  </svg>
);

const YouTubeLogo = () => (
  <svg className="notion-embed-logo" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9.545 15.568V8.432L15.818 12z" fill="#fff" />
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="#f00"
    />
  </svg>
);

const SoundCloudLogo = () => (
  <span className="notion-embed-logo" aria-hidden="true">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z"
        fill="currentColor"
      />
    </svg>
    <span className="notion-embed-logo-text">SoundCloud</span>
  </span>
);

// The height of Spotify's player for a track
const SPOTIFY_CARD_HEIGHT = 152;

// Decorative bars in the place of SoundCloud's waveform
const BARS = Array.from(
  { length: 56 },
  (_, i) =>
    25 + Math.round(75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.4))),
);

/**
 * Players (Spotify, YouTube, ...) set third-party cookies and weigh hundreds
 * of KB, so this shows a card like the player and loads it only when asked.
 */
export const EmbedFacade = ({
  src,
  provider,
  height,
  title,
  author,
  image,
  playLabel,
  className: extra,
}: EmbedFacadeProps) => {
  const [active, setActive] = useState(false);
  if (active) {
    return (
      <iframe
        className={cx("notion-embed-player not-prose", extra)}
        src={provider === "YouTube" ? `${src}?autoplay=1` : src}
        title={title ?? provider}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        style={height ? { height } : { aspectRatio: "16 / 9" }}
      />
    );
  }

  const name = title ?? provider;
  const artwork = image && (
    <img className="notion-embed-image" src={image} alt="" loading="lazy" />
  );
  const button = (
    className: string,
    children: ReactNode,
    style?: CSSProperties,
  ) => (
    <button
      type="button"
      className={cx("notion-embed not-prose", className, extra)}
      style={style}
      onClick={() => setActive(true)}
      aria-label={`${playLabel}: ${name}`}
    >
      {children}
    </button>
  );

  if (provider === "Spotify") {
    return button(
      "notion-embed-spotify",
      <>
        {artwork}
        <span className="notion-embed-text">
          <span className="notion-embed-title">{name}</span>
          <span className="notion-embed-provider">Spotify</span>
        </span>
        <SpotifyLogo />
        <span className="notion-embed-play">
          <PlayIcon />
        </span>
      </>,
      {
        // Albums and playlists play in a 352px player, but a card that tall
        // is mostly empty. The page grows when it is clicked, which is fine:
        // the reader asked for it (and CLS ignores shifts right after input).
        height: SPOTIFY_CARD_HEIGHT,
        // Tints the card with the artwork, as Spotify's player does
        ...(image && {
          "--notion-embed-artwork": `url(${JSON.stringify(image)})`,
        }),
      } as CSSProperties,
    );
  }

  if (provider === "SoundCloud") {
    return button(
      "notion-embed-soundcloud",
      <>
        {artwork}
        <span className="notion-embed-body">
          <span className="notion-embed-head">
            <span className="notion-embed-play">
              <PlayIcon />
            </span>
            <span className="notion-embed-text">
              {author && <span className="notion-embed-author">{author}</span>}
              <span className="notion-embed-title">{name}</span>
            </span>
            <SoundCloudLogo />
          </span>
          <span className="notion-embed-waveform" aria-hidden="true">
            {BARS.map((bar, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed decoration
              <span key={i} style={{ height: `${bar}%` }} />
            ))}
          </span>
        </span>
      </>,
      { height },
    );
  }

  // Players without a fixed height are videos: show them as one
  if (!height) {
    return button(
      "notion-embed-video",
      <>
        {artwork}
        <span className="notion-embed-text">
          <span className="notion-embed-provider">{author ?? provider}</span>
          <span className="notion-embed-title">{name}</span>
        </span>
        {provider === "YouTube" && <YouTubeLogo />}
        <span className="notion-embed-play">
          <PlayIcon />
        </span>
      </>,
    );
  }

  return button(
    "",
    <>
      {artwork}
      <span className="notion-embed-text">
        <span className="notion-embed-provider">{provider}</span>
        <span className="notion-embed-title">{name}</span>
      </span>
      <span className="notion-embed-play">{playLabel}</span>
    </>,
  );
};
