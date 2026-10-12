import { describe, expect, it, vi } from "vitest";
import { createDedupe } from "./index.js";

describe("createDedupe", () => {
  it("shares one in-flight fetch between callers of the same key", async () => {
    const dedupe = createDedupe();
    const fetchRows = vi.fn(async () => ["row"]);

    const [first, second] = await Promise.all([
      dedupe("rows", fetchRows),
      dedupe("rows", fetchRows),
    ]);

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(first).toEqual(["row"]);
    expect(second).toBe(first);
  });

  it("fetches again after a failed fetch instead of caching the error", async () => {
    const dedupe = createDedupe();
    const fetchRows = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce(["row"]);

    await expect(dedupe("rows", fetchRows)).rejects.toThrow("rate limited");
    await expect(dedupe("rows", fetchRows)).resolves.toEqual(["row"]);
  });
});
