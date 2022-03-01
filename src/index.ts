export let logger = console;

export interface Cache<K, V> {
  get: (key: K) => V|undefined|Promise<V|undefined>;
  set: (key: K, value: V) => void|Promise<void>;
}

export interface CacheX<K, V, Out> {
  get: (key: K) => Out|undefined|Promise<Out|undefined>;
  set: (key: K, value: V) => Out|Promise<Out>;
}


export class Fetch<K, V> {
  constructor(private readonly fetch: (key: K) => Promise<V>) {
  }
  cache(cache: Cache<K, V>): Fetch<K, V> {
    const transient = new Map<K, V>()
    return new Fetch(async (key: K) => {
      let value = transient.get(key)
      if (value !== undefined) return value;
      value = await cache.get(key);
      if (value !== undefined) return value;
      value = await this.fetch(key);
      if (value !== undefined) {
        transient.set(key, value)
        Promise.resolve(value)
          .then(x => cache.set(key, x))
          .catch(logger.error)
          .then(() => transient.delete(key))
      }
      return value;
    })
  }
  cacheX<Out>(cache: CacheX<K, V, Out>): Fetch<K, Out> {
    return new Fetch(async (key: K) => {
      let value = await cache.get(key);
      if (value !== undefined) return value;
      value = await cache.set(key, await this.fetch(key))
      return value
    })
  }
  dedupe(): (key: K) => Promise<V> {
    const dedupe = new Map<K, Promise<V>>()
    return (key: K) => {
      let promise = dedupe.get(key)
      if (promise) return promise
      promise = this.fetch(key)
      dedupe.set(key, promise)
      promise
        .catch(err => "OK")
        .then(() => dedupe.delete(key))
      return promise
    }
  }
}
