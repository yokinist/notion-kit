import { APIResponseError, RequestTimeoutError } from "@notionhq/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequestLimiter } from "./index";

// A request that stays pending until the test lets it finish
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const rateLimited = (retryAfter: string) =>
  new APIResponseError({
    code: "rate_limited" as never,
    status: 429,
    message: "You have been rate limited.",
    headers: new Headers(),
    rawBodyText: "",
    additional_data: { retry_after: retryAfter },
    request_id: undefined,
  });

describe("createRequestLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs at most `concurrency` requests at once and returns their results", async () => {
    const limit = createRequestLimiter({ concurrency: 2 });
    const pending = [
      deferred<number>(),
      deferred<number>(),
      deferred<number>(),
    ];
    let started = 0;
    const results = pending.map((d) =>
      limit(() => {
        started++;
        return d.promise;
      }),
    );

    await Promise.resolve();
    expect(started).toBe(2);

    pending[0]?.resolve(1);
    await expect(results[0]).resolves.toBe(1);
    expect(started).toBe(3);

    pending[1]?.resolve(2);
    pending[2]?.resolve(3);
    await expect(Promise.all(results)).resolves.toEqual([1, 2, 3]);
  });

  it("waits for retry_after before retrying a rate-limited request", async () => {
    const limit = createRequestLimiter();
    const send = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(rateLimited("6"))
      .mockResolvedValueOnce("ok");

    const result = limit(send);
    await vi.advanceTimersByTimeAsync(5999);
    expect(send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("ok");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("retries a request that timed out", async () => {
    const limit = createRequestLimiter();
    const send = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new RequestTimeoutError())
      .mockResolvedValueOnce("ok");

    const result = limit(send);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe("ok");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("gives up after maxRetries and throws the last error", async () => {
    const limit = createRequestLimiter({ maxRetries: 2 });
    const send = vi.fn(() => Promise.reject(rateLimited("1")));

    const result = limit(send);
    const assertion = expect(result).rejects.toThrow(
      "You have been rate limited.",
    );
    await vi.runAllTimersAsync();

    await assertion;
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("throws other errors without retrying", async () => {
    const limit = createRequestLimiter();
    const send = vi.fn(() => Promise.reject(new Error("object_not_found")));

    await expect(limit(send)).rejects.toThrow("object_not_found");
    expect(send).toHaveBeenCalledTimes(1);
  });
});
