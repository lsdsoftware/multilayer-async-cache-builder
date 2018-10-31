### What Is It?

A multilayer cache works as follows.  When an item is requested, first we'll go through the cache layers one by one to look for it.  If the item is found in one of the layers, we'll write it back to the preceding layers, before returning it to the caller.  If the item is not found in any of the caches, we'll call the `fetch` function to fetch the item from its origin.

This tool helps you construct a multilayer cache by implementing the above behavior.  In addition, it will dedupe promises so that simultaneous requests for the same item won't trigger redundant cache look-ups or fetches.  What you need to do is provide the implementation of the `fetch` function and the caches.

```typescript
fetch<T>: (key: CacheKey) => Promise<T>

interface Cache<T> {
  get: (key: CacheKey) => Promise<T>
  set: (key: CacheKey, value: T): Promise<void>
}

interface CacheKey {
  toString: () => string
}
```


### Usage

```typescript
import { cached } from "multilayer-async-cache-builder"

const fetchItem = /* define your fetch function */
const cache1 = /* define your 1st cache layer */
const cache2 = /* define your 2nd cache layer */

const getItem = cached(fetchItem, [cache1, cache2]);

//use it
getItem("item-id").then(...)
```


### Example
```typescript
const memCache = {
  cache: {},
  get: videoId => this.cache[videoId],
  set: (videoId, data) => this.cache[videoId] = data
}
const diskCache = {
  get: videoId => promisify(fs.readFile)(`cache/${videoId}`).catch(err => undefined),
  set: (videoId, data) => promisify(fs.writeFile)(`cache/${videoId}`, data)
}
const fetchVideo = videoId => downloadFromYouTube(videoId).promise;

const getVideo = cached(fetchVideo, [memCache, diskCache]);
getVideo("video-id").then(...);
```
