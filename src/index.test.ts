import { cached, Cache } from "./index"

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
  const cache = {
    get: (key: string) => q.request<string>("get", key),
    set: (key: string, value: string) => q.request<void>("set", key, value)
  };
  const fetch = (key: string) => q.request<string>("fetch", key);
  const getItem = cached(fetch, [cache]);

  //MISS TEST
  let promise = getItem("one");

  //dedupe test
  expect(getItem("one")).toBe(promise);

  //expect cache read
  let req = await q.next();
  expect(req.args).toEqual(["get", "one"]);

  //dedupe test
  expect(getItem("one")).toBe(promise);

  //resolve cache read: miss
  req.fulfill(undefined);
  
  //expect fetch
  req = await q.next();
  expect(req.args).toEqual(["fetch", "one"]);

  //dedupe test
  expect(getItem("one")).toBe(promise);

  //resolve fetch
  req.fulfill("one sheep");

  //expect result
  expect(await promise).toBe("one sheep");

  //expect cache write
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

  //expect cache read
  req = await q.next();
  expect(req.args).toEqual(["get", "one"]);

  //resolve cache read: hit
  req.fulfill("one fish");

  //expect result
  expect(await promise).toBe("one fish");

  //check state
  expect(q.isClean()).toBe(true);
})
