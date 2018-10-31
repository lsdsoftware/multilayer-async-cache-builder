export let logger = console;

export interface CacheKey {
  toString: () => string;
}

export interface Cache<T> {
  get: (key: CacheKey) => Promise<T>;
  set: (key: CacheKey, value: T) => Promise<void>;
}


export function cached<T>(fetch: (key: CacheKey) => Promise<T>, caches: Cache<T>[]): (key: CacheKey) => Promise<T> {
  const cacheFetch = caches.reverse().reduce((nextFetch, cache) => {
    const transient: {[key: string]: T} = {};
    return async (key: CacheKey) => {
      const hashKey = key.toString();
      let value = transient[hashKey];
      if (value !== undefined) return value;
      value = await cache.get(key);
      if (value !== undefined) return value;
      value = await nextFetch(key);
      transient[hashKey] = value;
      Promise.resolve().then(() => cache.set(key, value)).catch(logger.error).then(() => delete transient[hashKey]);
      return value;
    }
  }, fetch)

  const dedupe: {[key: string]: Promise<T>} = {};
  return (key: CacheKey) => {
    const hashKey = key.toString();
    if (dedupe[hashKey]) return dedupe[hashKey];
    dedupe[hashKey] = cacheFetch(key);
    dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
    return dedupe[hashKey];
  }
}
