"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = exports.logger = void 0;
exports.logger = console;
class Fetch {
    constructor(fetch) {
        this.fetch = fetch;
    }
    cache(cache) {
        const transient = {};
        return new Fetch(async (key) => {
            const hashKey = String(key);
            let value = transient[hashKey];
            if (value !== undefined)
                return value;
            value = await cache.get(key);
            if (value !== undefined)
                return value;
            value = await this.fetch(key);
            if (value !== undefined) {
                transient[hashKey] = value;
                Promise.resolve(value).then(x => cache.set(key, x)).catch(exports.logger.error).then(() => delete transient[hashKey]);
            }
            return value;
        });
    }
    cacheX(cache) {
        return new Fetch(async (key) => {
            let value = await cache.get(key);
            if (value !== undefined)
                return value;
            const fetchedValue = await this.fetch(key);
            if (fetchedValue !== undefined) {
                value = await cache.set(key, fetchedValue);
            }
            return value;
        });
    }
    dedupe() {
        const dedupe = {};
        return (key) => {
            const hashKey = String(key);
            if (dedupe[hashKey])
                return dedupe[hashKey];
            dedupe[hashKey] = this.fetch(key);
            dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
            return dedupe[hashKey];
        };
    }
}
exports.Fetch = Fetch;
