### What
This tool helps you construct a multilayer async cache.  Usage:

```typescript
import { cached } from "multilayer-async-cache-builder"

const getItem = cached(fetchItem, [cache1, cache2, ...]);

//use it
getItem("item-id").then(...)
```

You provide the implementation of the `fetch` function, which fetches the item from its source.  You also provide the implementation of the caches (`cache1`, `cache2`, etc.).

```typescript
fetch: (key: CacheKey) => Promise<T>

interface Cache<T> {
  get: (key: CacheKey) => Promise<T>
  set: (key: CacheKey, value: T): Promise<void>
}

interface CacheKey {
  toString: () => string
}
```

The multilayer cache shall work as follows.  When an item is requested, first we'll go through the caches one by one to look for it.  If the item is found in one of the caches, we'll write it back to the preceding caches, before returning it to the caller.  If the item is not found in any of the caches, we'll call the `fetch` function.

We'll be sure to dedupe promises so that simultaneous requests for the same item won't trigger redundant cache look-ups or fetches.


### Example
```typescript
const memCache = {
  cache: {},
  get: videoId => return Promise.resolve(this.cache[videoId]),
  set: (videoId, data) => this.cache[videoId] = data
}
const diskCache = {
  get: videoId => return promisify(fs.readFile)(`cache/${videoId}`).catch(err => undefined),
  set: (videoId, data) => return promisify(fs.writeFile)(`cache/${videoId}`, data)
}
const fetchVideo = videoId => downloadFromYouTube(videoId).promise;

const getVideo = cached(fetchVideo, [memCache, diskCache]);
getVideo("27zlBpzdOZg").then(...);
```
