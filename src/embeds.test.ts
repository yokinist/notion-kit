import { describe, expect, it } from "vitest";
import { toEmbed } from "./index.js";

describe("toEmbed", () => {
  it("recognizes posts on X and Twitter", () => {
    expect(toEmbed("https://x.com/yokinist/status/123?s=20")).toEqual({
      kind: "tweet",
      id: "123",
    });
    expect(toEmbed("https://twitter.com/a/status/456")).toEqual({
      kind: "tweet",
      id: "456",
    });
  });

  it("turns YouTube, Spotify, SoundCloud and Instagram URLs into player URLs", () => {
    expect(toEmbed("https://youtu.be/abc_DEF-1")).toMatchObject({
      kind: "player",
      provider: "YouTube",
      src: "https://www.youtube-nocookie.com/embed/abc_DEF-1",
    });
    expect(toEmbed("https://www.youtube.com/watch?v=xyz&t=1")).toMatchObject({
      src: "https://www.youtube-nocookie.com/embed/xyz",
    });
    expect(
      toEmbed("https://open.spotify.com/intl-ja/track/4uLU6?si=x"),
    ).toEqual({
      kind: "player",
      provider: "Spotify",
      src: "https://open.spotify.com/embed/track/4uLU6",
      height: 152,
    });
    expect(toEmbed("https://open.spotify.com/album/9x")).toMatchObject({
      height: 352,
    });
    expect(toEmbed("https://soundcloud.com/artist/track?si=1")).toMatchObject({
      provider: "SoundCloud",
      src: "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack&hide_related=true&visual=false",
      height: 166,
    });
    expect(toEmbed("https://www.instagram.com/p/AbC/")).toMatchObject({
      provider: "Instagram",
      src: "https://www.instagram.com/p/AbC/embed",
    });
  });

  it("asks to follow SoundCloud short links first", () => {
    expect(toEmbed("https://on.soundcloud.com/AbC")).toEqual({
      kind: "redirect",
    });
  });

  it("falls back to a link for anything else", () => {
    expect(toEmbed("https://kankyrecords.bandcamp.com/album/x")).toEqual({
      kind: "link",
    });
    expect(toEmbed("not a url")).toEqual({ kind: "link" });
  });
});
