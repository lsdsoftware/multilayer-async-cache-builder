import { Cache, CacheEntry } from "./index"


test("main", async () => {
  Date.now = () => 1000;

  const mockGetObject = jest.fn()
    .mockRejectedValueOnce(new Error("Error NoSuchKey "))
    .mockResolvedValueOnce({Body: "two sheep", Metadata: {id: "two fish"}})
    .mockResolvedValue({Body: "last sheep", Metadata: {id: "last fish"}})

  const mockPutObject = jest.fn()
    .mockResolvedValue("OK")

  const mockMaterialize = jest.fn()
    .mockImplementation((key: string) => Promise.resolve({data: key + " sheep", metadata: {id: key + " fish"}}))

  const cache = new Cache({
    s3: <any>{
      getObject: (opts: any) => ({ promise: () => mockGetObject(opts) }),
      putObject: (opts: any) => ({ promise: () => mockPutObject(opts) })
    },
    bucketName: "test",
    memTtl: 5,
    materialize: mockMaterialize
  })

  let promise = cache.get("one");
  expect(cache.get("one")).toBe(promise);
  await expect(promise).resolves.toEqual({data: "one sheep", metadata: {id: "one fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(1);
  expect(mockGetObject).toHaveBeenLastCalledWith({Bucket: "test", Key: "one"});
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockPutObject).toHaveBeenLastCalledWith({Bucket: "test", Key: "one", Body: "one sheep", Metadata: {id: "one fish"}});
  expect(mockMaterialize).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenLastCalledWith("one");

  await expect(cache.get("one")).resolves.toEqual({data: "one sheep", metadata: {id: "one fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(1);
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);

  promise = cache.get("two");
  expect(cache.get("two")).toBe(promise);
  await expect(promise).resolves.toEqual({data: "two sheep", metadata: {id: "two fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(2);
  expect(mockGetObject).toHaveBeenLastCalledWith({Bucket: "test", Key: "two"});
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);

  await expect(cache.get("two")).resolves.toEqual({data: "two sheep", metadata: {id: "two fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(2);
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);

  Date.now = () => 5500;

  await expect(cache.get("two")).resolves.toEqual({data: "two sheep", metadata: {id: "two fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(2);
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);

  Date.now = () => 6500;

  await expect(cache.get("two")).resolves.toEqual({data: "two sheep", metadata: {id: "two fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(2);
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);

  await expect(cache.get("one")).resolves.toEqual({data: "last sheep", metadata: {id: "last fish"}});
  expect(mockGetObject).toHaveBeenCalledTimes(3);
  expect(mockPutObject).toHaveBeenCalledTimes(1);
  expect(mockMaterialize).toHaveBeenCalledTimes(1);
})
