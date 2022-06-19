export declare let logger: Console;
export interface Cache<V> {
    get: (hashKey: string) => Promise<V | undefined>;
    set: (hashKey: string, value: V) => Promise<void>;
}
export interface CacheX<V, Out> {
    get: (hashKey: string) => Promise<Out | undefined>;
    set: (hashKey: string, value: V) => Promise<Out>;
}
export declare class Fetch<K, V> {
    private readonly fetch;
    private readonly hashFunc;
    constructor(fetch: (key: K) => Promise<V>, hashFunc?: (key: K) => string);
    cache(cache: Cache<V>): Fetch<K, V>;
    cacheX<Out>(cache: CacheX<V, Out>): Fetch<K, Out>;
    map<Out>(mapper: (value: V) => Out): Fetch<K, Out>;
    dedupe(): (key: K) => Promise<V>;
}
