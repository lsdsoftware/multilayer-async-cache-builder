export let logger = console;

export interface CacheKey {
  toString: () => string;
}

export interface Cache<T> {
  get: (key: CacheKey) => T|Promise<T>;
  set: (key: CacheKey, value: T) => void|Promise<void>;
}

export interface CacheX<In, Out> {
  get: (key: CacheKey) => Out|Promise<Out>;
  set: (key: CacheKey, value: In) => Out|Promise<Out>;
}


export class Fetch<T> {
  constructor(private readonly fetch: (key: CacheKey) => Promise<T>) {
  }
  cache(cache: Cache<T>): Fetch<T> {
    const transient: {[key: string]: T} = {};
    return new Fetch(async (key: CacheKey) => {
      const hashKey = key.toString();
      let value = transient[hashKey];
      if (value !== undefined) return value;
      value = await cache.get(key);
      if (value !== undefined) return value;
      value = await this.fetch(key);
      transient[hashKey] = value;
      Promise.resolve().then(() => cache.set(key, value)).catch(logger.error).then(() => delete transient[hashKey]);
      return value;
    })
  }
  cacheX<Out>(cache: CacheX<T, Out>): Fetch<Out> {
    return new Fetch(async (key: CacheKey) => {
      let value = await cache.get(key);
      if (value !== undefined) return value;
      const fetchedValue = await this.fetch(key);
      value = await cache.set(key, fetchedValue);
      return value;
    })
  }
  dedupe(): (key: CacheKey) => Promise<T> {
    const dedupe: {[key: string]: Promise<T>} = {};
    return (key: CacheKey) => {
      const hashKey = key.toString();
      if (dedupe[hashKey]) return dedupe[hashKey];
      dedupe[hashKey] = this.fetch(key);
      dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
      return dedupe[hashKey];
    }
  }
}
