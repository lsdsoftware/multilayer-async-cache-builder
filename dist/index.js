"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = console;
class Cache {
    constructor(args) {
        this.args = args;
        this.memCache = {};
        this.lastCleanup = Date.now() + 5000;
    }
    get(key) {
        this.cleanup();
        if (this.memCache[key])
            return this.memCache[key];
        return this.memCache[key] = this.getFromS3(key)
            .catch(err => {
            if (!err.message.includes("NoSuchKey"))
                throw err;
            return this.args.materialize(key)
                .then(entry => {
                this.args.s3.putObject({ Bucket: this.args.bucketName, Key: key, Body: entry.data, Metadata: entry.metadata }).promise()
                    .then(() => this.memCache[key].expires = Date.now() + this.args.memTtl * 1000)
                    .catch(exports.logger.error);
                return entry;
            });
        });
    }
    getFromS3(key) {
        return this.args.s3.getObject({ Bucket: this.args.bucketName, Key: key }).promise()
            .then(res => ({ data: res.Body, metadata: res.Metadata }));
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
