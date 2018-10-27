import * as AWS from "aws-sdk"

export const logger = console;

export interface CacheEntry {
  data: AWS.S3.Body;
  metadata: AWS.S3.Metadata;
}

export interface CacheArgs {
  s3: AWS.S3;
  bucketName: string;
  materialize: (key: string) => Promise<CacheEntry>;
  memTtl: number;
}

export class Cache {
  private memCache: {[key: string]: Promise<CacheEntry>};
  private lastCleanup: number;
  constructor(private args: CacheArgs) {
    this.memCache = {};
    this.lastCleanup = Date.now() + 5000;
  }
  get(key: string): Promise<CacheEntry> {
    this.cleanup();
    if (this.memCache[key]) return this.memCache[key];
    return this.memCache[key] = this.getFromS3(key)
      .catch(err => {
        if (!err.message.includes("NoSuchKey")) throw err;
        return this.args.materialize(key)
          .then(entry => {
            this.args.s3.putObject({Bucket: this.args.bucketName, Key: key, Body: entry.data, Metadata: entry.metadata}).promise()
              .then(() => (<any>this.memCache[key]).expires = Date.now() + this.args.memTtl * 1000)
              .catch(logger.error)
            return entry;
          })
      })
  }
  getFromS3(key: string): Promise<CacheEntry> {
    return this.args.s3.getObject({Bucket: this.args.bucketName, Key: key}).promise()
      .then(res => ({data: res.Body, metadata: res.Metadata}))
  }
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.args.memTtl * 1000) {
      this.lastCleanup = now;
      for (const key in this.memCache) if ((<any>this.memCache[key]).expires < now) delete this.memCache[key];
    }
  }
}
