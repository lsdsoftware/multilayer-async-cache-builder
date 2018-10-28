import * as AWS from "aws-sdk";
export declare let logger: Console;
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
export declare class Cache {
    private args;
    private memCache;
    private lastCleanup;
    constructor(args: CacheArgs);
    get(key: CacheKey): Promise<CacheEntry>;
    private cleanup;
}
