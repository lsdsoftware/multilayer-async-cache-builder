export declare let logger: Console;
export interface CacheKey {
    toString: () => string;
}
export interface Cache<T> {
    get: (key: CacheKey) => T | Promise<T>;
    set: (key: CacheKey, value: T) => void | Promise<void>;
}
export interface CacheX<In, Out> {
    get: (key: CacheKey) => Out | Promise<Out>;
    set: (key: CacheKey, value: In) => Out | Promise<Out>;
}
export declare class Fetch<T> {
    private readonly fetch;
    constructor(fetch: (key: CacheKey) => Promise<T>);
    cache(cache: Cache<T>): Fetch<T>;
    cacheX<Out>(cache: CacheX<T, Out>): Fetch<Out>;
    dedupe(): (key: CacheKey) => Promise<T>;
}
