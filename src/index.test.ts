import { Fetch, Cache, CacheX } from "./index"

interface Request {
  args: any[],
  fulfill: (result?: any) => void,
  reject: (err: any) => void
}

class RequestQueue {
  private items: Array<Request>;
  private waiters: Array<(req: Request) => void>;
  constructor() {
    this.items = [];
    this.waiters = [];
  }
  request<T>(...args: any[]): Promise<T> {
    return new Promise((fulfill, reject) => {
      this.items.push({args, fulfill, reject});
      this.service();
    })
  }
  next(): Promise<Request> {
    return new Promise(fulfill => {
      this.waiters.push(fulfill);
      this.service();
    })
  }
  private service() {
    while (this.items.length && this.waiters.length)
      this.waiters.shift()(this.items.shift());
  }
  isClean() {
    return this.items.length == 0 && this.waiters.length == 0;
  }
}


test("main", async () => {
  const q = new RequestQueue();
  const cache1: Cache<string> = {
    get: (key: string) => q.request<string>("get", key),
    set: (key: string, value: string) => q.request<void>("set", key, value)
  };
  const cache2: CacheX<number, string> = {
    get: (key: string) => q.request<string>("get2", key),
    set: (key: string, value: number) => q.request<string>("set2", key, value)
  };
  const fetch = (key: string) => q.request<number>("fetch", key);
  const getItem = new Fetch(fetch).cacheX(cache2).cache(cache1).dedupe();

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
})
