import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EmbedFacade } from "./index.js";

describe("EmbedFacade", () => {
  it("loads the player only after it is clicked", async () => {
    render(
      <EmbedFacade
        src="https://open.spotify.com/embed/album/9x"
        provider="Spotify"
        height={352}
        title="Weightless"
        playLabel="Play"
      />,
    );
    expect(document.querySelector("iframe")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Play: Weightless" }),
    );

    const player = screen.getByTitle("Weightless");
    expect(player.tagName).toBe("IFRAME");
    expect(player.getAttribute("src")).toBe(
      "https://open.spotify.com/embed/album/9x",
    );
    expect(player.style.height).toBe("352px");
  });

  it("starts YouTube right away, since the click was the request to play", async () => {
    render(
      <EmbedFacade
        src="https://www.youtube-nocookie.com/embed/abc"
        provider="YouTube"
        playLabel="Play"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Play: YouTube" }),
    );

    expect(screen.getByTitle("YouTube").getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/abc?autoplay=1",
    );
  });

  it("keeps album and playlist cards as compact as a track's", () => {
    render(
      <EmbedFacade
        src="https://open.spotify.com/embed/playlist/9x"
        provider="Spotify"
        height={352}
        title="Mon. 7:19"
        playLabel="Play"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Play: Mon. 7:19" }).style.height,
    ).toBe("152px");
  });
});
