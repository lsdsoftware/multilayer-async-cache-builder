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
const index_1 = require("./index");
class RequestQueue {
    constructor() {
        this.items = [];
        this.waiters = [];
    }
    request(...args) {
        return new Promise((fulfill, reject) => {
            this.items.push({ args, fulfill, reject });
            this.service();
        });
    }
    next() {
        return new Promise(fulfill => {
            this.waiters.push(fulfill);
            this.service();
        });
    }
    service() {
        while (this.items.length && this.waiters.length)
            this.waiters.shift()(this.items.shift());
    }
    isClean() {
        return this.items.length == 0 && this.waiters.length == 0;
    }
}
test("main", () => __awaiter(this, void 0, void 0, function* () {
    const q = new RequestQueue();
    const cache1 = {
        get: (key) => q.request("get", key),
        set: (key, value) => q.request("set", key, value)
    };
    const cache2 = {
        get: (key) => q.request("get2", key),
        set: (key, value) => q.request("set2", key, value)
    };
    const fetch = (key) => q.request("fetch", key);
    const getItem = new index_1.Fetch(fetch).cacheX(cache2).cache(cache1).dedupe();
    //MISS TEST
    let promise = getItem("one");
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //expect cache1 read
    let req = yield q.next();
    expect(req.args).toEqual(["get", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve cache1 read: miss
    req.fulfill(undefined);
    //expect cache2 read
    req = yield q.next();
    expect(req.args).toEqual(["get2", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve cache2 read: miss
    req.fulfill(undefined);
    //expect fetch
    req = yield q.next();
    expect(req.args).toEqual(["fetch", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve fetch
    req.fulfill(1);
    //expect cache2 write
    req = yield q.next();
    expect(req.args).toEqual(["set2", "one", 1]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //cache2 transform value
    req.fulfill("one sheep");
    //expect result
    expect(yield promise).toBe("one sheep");
    //expect cache1 write
    req = yield q.next();
    expect(req.args).toEqual(["set", "one", "one sheep"]);
    //transient test
    expect(yield getItem("one")).toBe("one sheep");
    //resolve cache write
    req.fulfill();
    //check state
    expect(q.isClean()).toBe(true);
    //wait for transient to clear
    yield new Promise(fulfill => setTimeout(fulfill, 0));
    //HIT TEST
    promise = getItem("one");
    //expect cache1 read
    req = yield q.next();
    expect(req.args).toEqual(["get", "one"]);
    //resolve cache1 read: hit
    req.fulfill("one fish");
    //expect result
    expect(yield promise).toBe("one fish");
    //check state
    expect(q.isClean()).toBe(true);
}));
