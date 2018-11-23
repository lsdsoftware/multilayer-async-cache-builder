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
class Fetch {
    constructor(fetch) {
        this.fetch = fetch;
    }
    cache(cache) {
        const transient = {};
        return new Fetch((key) => __awaiter(this, void 0, void 0, function* () {
            const hashKey = key.toString();
            let value = transient[hashKey];
            if (value !== undefined)
                return value;
            value = yield cache.get(key);
            if (value !== undefined)
                return value;
            value = yield this.fetch(key);
            transient[hashKey] = value;
            Promise.resolve().then(() => cache.set(key, value)).catch(exports.logger.error).then(() => delete transient[hashKey]);
            return value;
        }));
    }
    cacheX(cache) {
        return new Fetch((key) => __awaiter(this, void 0, void 0, function* () {
            let value = yield cache.get(key);
            if (value !== undefined)
                return value;
            const fetchedValue = yield this.fetch(key);
            value = yield cache.set(key, fetchedValue);
            return value;
        }));
    }
    dedupe() {
        const dedupe = {};
        return (key) => {
            const hashKey = key.toString();
            if (dedupe[hashKey])
                return dedupe[hashKey];
            dedupe[hashKey] = this.fetch(key);
            dedupe[hashKey].catch(err => "OK").then(() => delete dedupe[hashKey]);
            return dedupe[hashKey];
        };
    }
}
exports.Fetch = Fetch;
