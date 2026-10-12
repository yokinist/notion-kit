import { APIResponseError, RequestTimeoutError } from "@notionhq/client";

export type RequestLimiterOptions = {
  /** Requests allowed in flight at once. Notion allows about 3 per second. */
  concurrency?: number;
  /** How many times one request is retried before its error is thrown. */
  maxRetries?: number;
};

export type RequestLimiter = <T>(send: () => Promise<T>) => Promise<T>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// How long to wait before retrying, or undefined if the error is final
const retryDelay = (error: unknown, attempt: number): number | undefined => {
  if (RequestTimeoutError.isRequestTimeoutError(error)) return 1000;
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
 * rate limits after the delay Notion asks for, and timeouts. The official client also
 * retries, but gives up after a couple of attempts, which builds that fetch
 * many pages at once easily exceed.
 */
export const createRequestLimiter = ({
  concurrency = 2,
  maxRetries = 10,
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
        return await send();
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
