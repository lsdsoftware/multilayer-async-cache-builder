export declare let logger: Console;
export interface CacheKey {
    toString: () => string;
}
export interface Cache<T> {
    get: (key: CacheKey) => T | Promise<T>;
    set: (key: CacheKey, value: T) => void | Promise<void>;
}
export declare function cached<T>(fetch: (key: CacheKey) => Promise<T>, caches: Cache<T>[]): (key: CacheKey) => Promise<T>;
