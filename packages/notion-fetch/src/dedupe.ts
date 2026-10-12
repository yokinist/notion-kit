/**
 * Shares one fetch between callers that ask for the same key, e.g. pages
 * statically generated in parallel that all need the same database rows.
 */
export const createDedupe = () => {
  const inFlight = new Map<string, Promise<unknown>>();
  return <T>(key: string, fetch: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const shared = fetch();
    inFlight.set(key, shared);
    // A failure should not stick: let the next caller try again
    shared.catch(() => inFlight.delete(key));
    return shared;
  };
};
