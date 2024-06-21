"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = void 0;
class Fetch {
    constructor(fetch) {
        this.fetch = fetch;
    }
    hashFunc(key) {
        if (typeof key == "undefined")
            return "singleton";
        if (typeof key == "string")
            return key;
        return key.hashKey;
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
                    .catch(console.error)
                    .then(() => transient.delete(hashKey));
            }
            return value;
        });
    }
    cacheX(cache) {
        return new Fetch(async (key) => {
            const hashKey = this.hashFunc(key);
            let value = await cache.get(hashKey);
            if (value !== undefined)
                return value;
            value = await cache.set(hashKey, await this.fetch(key));
            return value;
        });
    }
    map(mapper) {
        return new Fetch(async (key) => mapper(await this.fetch(key), key));
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
