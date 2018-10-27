import { Cache, CacheEntry } from "./index"
import { promisify } from "util"
import * as AWS from "aws-sdk"

test("main", () => {
  const mockGetObject = jest.fn(req => {
    promise: () => promisify(setTimeout)(500).then(() => ({data: "from s3", metadata: {contentType: "junk"}}))
  })
  const mockPutObject = jest.fn(req => {
    promise: () => promisify(setTimeout)(1000)
  })
  const mockMaterialize = jest.fn(key => promisify(setTimeout)(2000).then(() => ({data: "from web", metadata: {contentType: "crap"}})));

  const cache = new Cache({
    s3: <any>{
      getObject: mockGetObject,
      putObject: mockPutObject
    },
    bucketName: "test",
    memTtl: 5,
    materialize: mockMaterialize
  })

  
})