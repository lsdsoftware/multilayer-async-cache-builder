"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = exports.logger = void 0;
exports.logger = console;
class Fetch {
    constructor(fetch, hashFunc = String) {
        this.fetch = fetch;
        this.hashFunc = hashFunc;
    }
    cache(cache) {
        const transient = new Map();
        return new Fetch(async (key) => {
            const hashKey = this.hashFunc(key);
            let value = transient.get(hashKey);
            if (value !== undefined)
                return value;
            value = await cache.get(hashKey);
            if (value !== undefined)
                return value;
            value = await this.fetch(key);
            if (value !== undefined) {
                transient.set(hashKey, value);
                Promise.resolve(value)
                    .then(x => cache.set(hashKey, x))
                    .catch(exports.logger.error)
                    .then(() => transient.delete(hashKey));
            }
            return value;
        }, this.hashFunc);
    }
    cacheX(cache) {
        return new Fetch(async (key) => {
            const hashKey = this.hashFunc(key);
            let value = await cache.get(hashKey);
            if (value !== undefined)
                return value;
            value = await cache.set(hashKey, await this.fetch(key));
            return value;
        }, this.hashFunc);
    }
    map(mapper) {
        return new Fetch(async (key) => mapper(await this.fetch(key), key), this.hashFunc);
    }
    dedupe() {
        const dedupe = new Map();
        return (key) => {
            const hashKey = this.hashFunc(key);
            let promise = dedupe.get(hashKey);
            if (promise)
                return promise;
            promise = this.fetch(key);
            dedupe.set(hashKey, promise);
            promise
                .catch(err => "OK")
                .then(() => dedupe.delete(hashKey));
            return promise;
        };
    }
}
exports.Fetch = Fetch;
