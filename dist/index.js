"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
exports.logger = console;
class Cache {
    constructor(args) {
        this.args = args;
        assert(args && args.s3 && args.bucketName && args.materialize, "Missing args");
        assert(args.memTtl >= 5, "Mem TTL must be at least 5");
        this.memCache = {};
        this.lastCleanup = Date.now();
    }
    get(key) {
        this.cleanup();
        if (!this.memCache[key]) {
            this.memCache[key] = this.args.s3.getObject({ Bucket: this.args.bucketName, Key: key }).promise()
                .then(res => ({ data: res.Body, metadata: res.Metadata }))
                .catch(err => {
                if (!err.message.includes("NoSuchKey"))
                    throw err;
                return this.args.materialize(key)
                    .then(entry => {
                    this.args.s3.putObject({ Bucket: this.args.bucketName, Key: key, Body: entry.data, Metadata: entry.metadata }).promise().catch(exports.logger.error);
                    return entry;
                });
            });
        }
        this.memCache[key].expires = Date.now() + this.args.memTtl * 1000;
        return this.memCache[key];
    }
    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup > this.args.memTtl * 1000) {
            this.lastCleanup = now;
            for (const key in this.memCache)
                if (this.memCache[key].expires < now)
                    delete this.memCache[key];
        }
    }
}
exports.Cache = Cache;
