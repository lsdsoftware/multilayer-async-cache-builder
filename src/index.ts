export let logger = console;

export interface Cache<K, V> {
  get: (key: K) => V|undefined|Promise<V|undefined>;
  set: (key: K, value: V) => void|Promise<void>;
}

export interface CacheX<K, V, Out> {
  get: (key: K) => Out|Promise<Out>;
  set: (key: K, value: V) => Out|Promise<Out>;
}


export class Fetch<K, V> {
  constructor(private readonly fetch: (key: K) => Promise<V>) {
  }
  cache(cache: Cache<K, V>): Fetch<K, V> {
    const transient: {[key: string]: V|undefined} = {};
    return new Fetch(async (key: K) => {
      const hashKey = String(key);
      let value = transient[hashKey];
      if (value !== undefined) return value;
      value = await cache.get(key);
      if (value !== undefined) return value;
      value = await this.fetch(key);
      if (value !== undefined) {
        transient[hashKey] = value;
        Promise.resolve(value).then(x => cache.set(key, x)).catch(logger.error).then(() => delete transient[hashKey]);
      }
      return value;
    })
  }
  cacheX<Out>(cache: CacheX<K, V, Out>): Fetch<K, Out> {
    return new Fetch(async (key: K) => {
      let value = await cache.get(key);
      if (value !== undefined) return value;
      const fetchedValue = await this.fetch(key);
      if (fetchedValue !== undefined) {
        value = await cache.set(key, fetchedValue);
      }
      return value;
    })
  }
  dedupe(): (key: K) => Promise<V> {
    const dedupe: {[key: string]: Promise<V>} = {};
    return (key: K) => {
      const hashKey = String(key);
      if (dedupe[hashKey]) return dedupe[hashKey];
      dedupe[hashKey] = this.fetch(key);
      dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
      return dedupe[hashKey];
    }
  }
}
