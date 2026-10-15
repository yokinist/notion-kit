import { APIResponseError, RequestTimeoutError } from "@notionhq/client";

export type RequestLimiterOptions = {
  /** Requests allowed in flight at once. Notion allows about 3 per second. */
  concurrency?: number;
  /** How many times one request is retried before its error is thrown. */
  maxRetries?: number;
  /**
   * How long one attempt may take, response body included, before it is
   * given up and retried. The client's own timeoutMs only covers the headers.
   */
  timeoutMs?: number;
};

export type RequestLimiter = <T>(send: () => Promise<T>) => Promise<T>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The request itself is not cancelled; createTimeoutFetch does that
const withTimeout = <T>(promise: Promise<T>, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestTimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// How long to wait before retrying, or undefined if the error is final
const retryDelay = (error: unknown, attempt: number): number | undefined => {
  // RequestTimeoutError comes from the client or withTimeout, TimeoutError
  // from createTimeoutFetch's signal
  if (
    RequestTimeoutError.isRequestTimeoutError(error) ||
    (error instanceof Error && error.name === "TimeoutError")
  )
    return 1000;
  if (APIResponseError.isAPIResponseError(error) && error.status === 429) {
    const seconds = Number(
      (error.additional_data as { retry_after?: string } | undefined)
        ?.retry_after,
    );
    return (Number.isFinite(seconds) ? seconds : 2 ** attempt) * 1000;
  }
  return undefined;
};

/**
 * Runs Notion API requests with a cap on how many are in flight, retrying
 * rate limits after the delay Notion asks for, and requests that take longer
 * than timeoutMs, so one stalled connection cannot hang a build. The official
 * client also retries, but gives up after a couple of attempts, which builds
 * that fetch many pages at once easily exceed. Wrap one request per call.
 */
export const createRequestLimiter = ({
  concurrency = 2,
  maxRetries = 10,
  timeoutMs = 30_000,
}: RequestLimiterOptions = {}): RequestLimiter => {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async (send) => {
    for (let attempt = 0; ; attempt++) {
      if (active >= concurrency) {
        await new Promise<void>((resolve) => waiting.push(resolve));
      }
      active++;
      let delay: number | undefined;
      try {
        return await withTimeout(send(), timeoutMs);
      } catch (error) {
        delay = attempt < maxRetries ? retryDelay(error, attempt) : undefined;
        if (delay === undefined) throw error;
      } finally {
        active--;
        waiting.shift()?.();
      }
      // Wait without holding a slot, so other requests keep going
      await sleep(delay);
    }
  };
};

/**
 * A fetch for `new Client({ fetch })` that aborts each request, response body
 * included, after timeoutMs, so a stalled connection is closed. The signal
 * also keeps Next.js from sharing one GET between identical requests in a
 * render, so a retry is a new request, not the same stalled response.
 */
export const createTimeoutFetch =
  ({ timeoutMs = 30_000 }: { timeoutMs?: number } = {}) =>
  (url: string, init?: RequestInit) =>
    fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
