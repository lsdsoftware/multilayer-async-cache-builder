### Weaselly Sales Pitch
Would you like to cache your stuff in S3?  Then this library is for you.  The Smart S3 Cache will solve all your S3 caching needs.  And even better, it's completely free!  Download now, and never worry about caching again.

### Installation
```
npm i s3-smart-cache
```

### Typical Usage
```typescript
import * as AWS from "aws-sdk"
import { Cache, CacheEntry } from "s3-smart-cache"

const s3 = new AWS.S3(/* config */);
const cache = new Cache(s3, "my-cache-bucket");

function getStuff(key: string): CacheEntry {
  return cache.get(key)
}
```