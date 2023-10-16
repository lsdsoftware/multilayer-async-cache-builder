"use strict";
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
test("main", async () => {
    const q = new RequestQueue();
    const cache1 = {
        get: key => q.request("get", key),
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
    let req = await q.next();
    expect(req.args).toEqual(["get", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve cache1 read: miss
    req.fulfill(undefined);
    //expect cache2 read
    req = await q.next();
    expect(req.args).toEqual(["get2", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve cache2 read: miss
    req.fulfill(undefined);
    //expect fetch
    req = await q.next();
    expect(req.args).toEqual(["fetch", "one"]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //resolve fetch
    req.fulfill(1);
    //expect cache2 write
    req = await q.next();
    expect(req.args).toEqual(["set2", "one", 1]);
    //dedupe test
    expect(getItem("one")).toBe(promise);
    //cache2 transform value
    req.fulfill("one sheep");
    //expect result
    expect(await promise).toBe("one sheep");
    //expect cache1 write
    req = await q.next();
    expect(req.args).toEqual(["set", "one", "one sheep"]);
    //transient test
    expect(await getItem("one")).toBe("one sheep");
    //resolve cache write
    req.fulfill();
    //check state
    expect(q.isClean()).toBe(true);
    //wait for transient to clear
    await new Promise(fulfill => setTimeout(fulfill, 0));
    //HIT TEST
    promise = getItem("one");
    //expect cache1 read
    req = await q.next();
    expect(req.args).toEqual(["get", "one"]);
    //resolve cache1 read: hit
    req.fulfill("one fish");
    //expect result
    expect(await promise).toBe("one fish");
    //check state
    expect(q.isClean()).toBe(true);
});
test("null-key", async () => {
    const q = new RequestQueue();
    const cache1 = {
        get: (key) => q.request("get", key),
        set: (key, value) => q.request("set", key, value)
    };
    const fetch = (key) => q.request("fetch", key);
    const getItem = new index_1.Fetch(fetch).cache(cache1).dedupe();
    const promise = getItem();
    //dedupe test
    expect(getItem()).toBe(promise);
    //expect cache read
    let req = await q.next();
    expect(req.args).toEqual(["get", "singleton"]);
    //resolve cache read: miss
    req.fulfill(undefined);
    //expect fetch
    req = await q.next();
    expect(req.args).toEqual(["fetch", undefined]);
    //resolve fetch
    req.fulfill(-100);
    //expect result
    expect(await promise).toBe(-100);
    //expect cache write
    req = await q.next();
    expect(req.args).toEqual(["set", "singleton", -100]);
    //transient test
    expect(await getItem()).toBe(-100);
    //resolve cache write
    req.fulfill();
    //check state
    expect(q.isClean()).toBe(true);
});
