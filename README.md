### How It Works

Our multilayer cache shall work as follows.  When an item is requested, first we'll go through the cache layers one by one to look for it.  If the item is found in one of the layers, we'll write it back to the preceding layers, before returning it to the caller.  If the item is not found in any of the caches, we'll call the `fetch` function to fetch the item from its origin.

This tool helps you construct a multilayer cache by implementing the above behavior.  In addition, it will dedupe promises so that concurrent requests for the same item won't trigger redundant cache look-ups or fetches.  What you need to do is provide the implementation for the `fetch` function and for each of the caches.  Your implementations need not worry at all about concurrency.

```typescript
fetch<K, V>: (key: K) => Promise<V>

interface Cache<V> {
  get: (hashKey: string) => Promise<V>
  set: (hashKey: string, value: V) => Promise<void>
}
```


### Usage

```typescript
import { Fetch } from "multilayer-async-cache-builder"

const fetchItem = /* define your fetch function */
const cache1 = /* define your 1st cache layer */
const cache2 = /* define your 2nd cache layer */

const getItem = new Fetch(fetchItem)
  .cache(cache2)
  .cache(cache1)
  .dedupe()

//use it
getItem("item-id")
  .then(...)
```


### Example

For a basic example, see [simple-cache](https://github.com/lsdsoftware/simple-cache)


### Transformer Cache

A transformer cache can return a different value to preceding layers than the one it received from subsequent layers.

```typescript
interface CacheX<V, Out> {
  get: (hashKey: string) => Promise<Out>
  set: (hashKey: string, value: V) => Promise<Out>
}
```

Note that the `set` method for a transformer cache must also return the transformed value.
