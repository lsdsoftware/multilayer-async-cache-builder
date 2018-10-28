import * as assert from "assert"
import * as AWS from "aws-sdk"


export let logger = console;

export interface CacheKey {
  toString: () => string;
}

export interface CacheEntry {
  data: AWS.S3.Body;
  metadata: AWS.S3.Metadata;
}

export interface CacheArgs {
  s3: AWS.S3;
  bucketName: string;
  materialize: (key: CacheKey) => Promise<CacheEntry>;
  memTtl: number;
}



export class Cache {
  private memCache: {[key: string]: Promise<CacheEntry>};
  private lastCleanup: number;

  constructor(private args: CacheArgs) {
    assert(args && args.s3 && args.bucketName && args.materialize, "Missing args");
    assert(args.memTtl >= 5, "Mem TTL must be at least 5");
    this.memCache = {};
    this.lastCleanup = Date.now();
  }

  get(key: CacheKey): Promise<CacheEntry> {
    this.cleanup();
    const hashKey = key.toString();
    if (!this.memCache[hashKey]) {
      this.memCache[hashKey] = this.args.s3.getObject({Bucket: this.args.bucketName, Key: hashKey}).promise()
        .then(res => ({data: res.Body, metadata: res.Metadata}))
        .catch(err => {
          if (err.code != "NoSuchKey") throw err;
          return this.args.materialize(key)
            .then(entry => {
              this.args.s3.putObject({Bucket: this.args.bucketName, Key: hashKey, Body: entry.data, Metadata: entry.metadata}).promise().catch(logger.error);
              return entry;
            })
        })
    }
    (<any>this.memCache[hashKey]).expires = Date.now() + this.args.memTtl * 1000;
    return this.memCache[hashKey];
  }

  private cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.args.memTtl * 1000) {
      this.lastCleanup = now;
      for (const key in this.memCache) if ((<any>this.memCache[key]).expires < now) delete this.memCache[key];
    }
  }
}
