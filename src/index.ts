import * as assert from "assert"
import * as AWS from "aws-sdk"


export let logger = console;

export interface CacheEntry {
  data: AWS.S3.Body;
  metadata: AWS.S3.Metadata;
}

export interface CacheArgs {
  s3: AWS.S3;
  bucketName: string;
  materialize: (key: string, ...extra: any[]) => Promise<CacheEntry>;
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

  get(key: string, ...extra: any[]): Promise<CacheEntry> {
    this.cleanup();
    if (!this.memCache[key]) {
      this.memCache[key] = this.args.s3.getObject({Bucket: this.args.bucketName, Key: key}).promise()
        .then(res => ({data: res.Body, metadata: res.Metadata}))
        .catch(err => {
          if (!err.message.includes("NoSuchKey")) throw err;
          return this.args.materialize(key, ...extra)
            .then(entry => {
              this.args.s3.putObject({Bucket: this.args.bucketName, Key: key, Body: entry.data, Metadata: entry.metadata}).promise().catch(logger.error);
              return entry;
            })
        })
    }
    (<any>this.memCache[key]).expires = Date.now() + this.args.memTtl * 1000;
    return this.memCache[key];
  }

  private cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.args.memTtl * 1000) {
      this.lastCleanup = now;
      for (const key in this.memCache) if ((<any>this.memCache[key]).expires < now) delete this.memCache[key];
    }
  }
}
