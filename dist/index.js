"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = exports.logger = void 0;
exports.logger = console;
class Fetch {
    constructor(fetch) {
        this.fetch = fetch;
    }
    cache(cache) {
        const transient = new Map();
        return new Fetch(async (key) => {
            let value = transient.get(key);
            if (value !== undefined)
                return value;
            value = await cache.get(key);
            if (value !== undefined)
                return value;
            value = await this.fetch(key);
            if (value !== undefined) {
                transient.set(key, value);
                Promise.resolve(value)
                    .then(x => cache.set(key, x))
                    .catch(exports.logger.error)
                    .then(() => transient.delete(key));
            }
            return value;
        });
    }
    cacheX(cache) {
        return new Fetch(async (key) => {
            let value = await cache.get(key);
            if (value !== undefined)
                return value;
            value = await cache.set(key, await this.fetch(key));
            return value;
        });
    }
    dedupe() {
        const dedupe = new Map();
        return (key) => {
            let promise = dedupe.get(key);
            if (promise)
                return promise;
            promise = this.fetch(key);
            dedupe.set(key, promise);
            promise
                .catch(err => "OK")
                .then(() => dedupe.delete(key));
            return promise;
        };
    }
}
exports.Fetch = Fetch;
