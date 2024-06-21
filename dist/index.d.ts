export interface Cache<V> {
    get: (hashKey: string) => Promise<V | undefined>;
    set: (hashKey: string, value: V) => Promise<void>;
}
export interface CacheX<V, Out> {
    get: (hashKey: string) => Promise<Out | undefined>;
    set: (hashKey: string, value: V) => Promise<Out>;
}
export declare class Fetch<K extends void | string | {
    hashKey: string;
}, V> {
    private readonly fetch;
    constructor(fetch: (key: K) => Promise<V>);
    private hashFunc;
    cache(cache: Cache<V>): Fetch<K, V>;
    cacheX<Out>(cache: CacheX<V, Out>): Fetch<K, Out>;
    map<Out>(mapper: (value: V, key: K) => Out | Promise<Out>): Fetch<K, Out>;
    dedupe(): (key: K) => Promise<V>;
}
