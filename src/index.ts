
export interface Cache<V> {
  get: (hashKey: string) => Promise<V|undefined>;
  set: (hashKey: string, value: V) => Promise<void>;
}

export interface CacheX<V, Out> {
  get: (hashKey: string) => Promise<Out|undefined>;
  set: (hashKey: string, value: V) => Promise<Out>;
}


export class Fetch<K extends void|string|{hashKey: string}, V> {
  constructor(private readonly fetch: (key: K) => Promise<V>) {
  }
  private hashFunc(key: K): string {
    if (typeof key == "undefined") return "singleton"
    if (typeof key == "string") return key
    return key.hashKey
  }
  cache(cache: Cache<V>): Fetch<K, V> {
    const transient = new Map<string, V>()
    return new Fetch(async (key: K) => {
      const hashKey = this.hashFunc(key)
      let value = transient.get(hashKey)
      if (value !== undefined) return value;
      value = await cache.get(hashKey)
      if (value !== undefined) return value;
      value = await this.fetch(key);
      if (value !== undefined) {
        transient.set(hashKey, value)
        Promise.resolve(value)
          .then(x => cache.set(hashKey, x))
          .catch(console.error)
          .then(() => transient.delete(hashKey))
      }
      return value;
    })
  }
  cacheX<Out>(cache: CacheX<V, Out>): Fetch<K, Out> {
    return new Fetch(async (key: K) => {
      const hashKey = this.hashFunc(key)
      let value = await cache.get(hashKey)
      if (value !== undefined) return value;
      value = await cache.set(hashKey, await this.fetch(key))
      return value
    })
  }
  map<Out>(mapper: (value: V, key: K) => Out|Promise<Out>): Fetch<K, Out> {
    return new Fetch(async key => mapper(await this.fetch(key), key))
  }
  dedupe(): (key: K) => Promise<V> {
    const dedupe = new Map<string, Promise<V>>()
    return (key: K) => {
      const hashKey = this.hashFunc(key)
      let promise = dedupe.get(hashKey)
      if (promise) return promise
      promise = this.fetch(key)
      dedupe.set(hashKey, promise)
      promise
        .catch(err => "OK")
        .then(() => dedupe.delete(hashKey))
      return promise
    }
  }
}
