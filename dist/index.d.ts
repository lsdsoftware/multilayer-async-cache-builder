export declare let logger: Console;
export interface CacheKey {
    toString: () => string;
}
export interface Cache<T> {
    get: (key: CacheKey) => Promise<T>;
    set: (key: CacheKey, value: T) => Promise<void>;
}
export declare function cached<T>(fetch: (key: CacheKey) => Promise<T>, caches: Cache<T>[]): (key: CacheKey) => Promise<T>;
