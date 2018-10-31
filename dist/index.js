"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = console;
function cached(fetch, caches) {
    const cacheFetch = caches.reverse().reduce((nextFetch, cache) => {
        const transient = {};
        return (key) => __awaiter(this, void 0, void 0, function* () {
            const hashKey = key.toString();
            let value = transient[hashKey];
            if (value !== undefined)
                return value;
            value = yield cache.get(key);
            if (value !== undefined)
                return value;
            value = yield nextFetch(key);
            transient[hashKey] = value;
            cache.set(key, value).catch(exports.logger.error).then(() => delete transient[hashKey]);
            return value;
        });
    }, fetch);
    const dedupe = {};
    return (key) => {
        const hashKey = key.toString();
        if (dedupe[hashKey])
            return dedupe[hashKey];
        dedupe[hashKey] = cacheFetch(key);
        dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
        return dedupe[hashKey];
    };
}
exports.cached = cached;
