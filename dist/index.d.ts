export declare let logger: Console;
export interface Cache<K, V> {
    get: (key: K) => V | undefined | Promise<V | undefined>;
    set: (key: K, value: V) => void | Promise<void>;
}
export interface CacheX<K, V, Out> {
    get: (key: K) => Out | Promise<Out>;
    set: (key: K, value: V) => Out | Promise<Out>;
}
export declare class Fetch<K, V> {
    private readonly fetch;
    constructor(fetch: (key: K) => Promise<V>);
    cache(cache: Cache<K, V>): Fetch<K, V>;
    cacheX<Out>(cache: CacheX<K, V, Out>): Fetch<K, Out>;
    dedupe(): (key: K) => Promise<V>;
}
