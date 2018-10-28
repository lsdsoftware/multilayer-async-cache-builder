"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
test("main", () => __awaiter(this, void 0, void 0, function* () {
    Date.now = () => 1000;
    const mockGetObject = jest.fn()
        .mockRejectedValueOnce(new Error("Error NoSuchKey "))
        .mockResolvedValueOnce({ Body: "two sheep", Metadata: { id: "two fish" } })
        .mockResolvedValue({ Body: "last sheep", Metadata: { id: "last fish" } });
    const mockPutObject = jest.fn()
        .mockResolvedValue("OK");
    const mockMaterialize = jest.fn()
        .mockImplementation((key) => Promise.resolve({ data: key + " sheep", metadata: { id: key + " fish" } }));
    const cache = new index_1.Cache({
        s3: {
            getObject: (opts) => ({ promise: () => mockGetObject(opts) }),
            putObject: (opts) => ({ promise: () => mockPutObject(opts) })
        },
        bucketName: "test",
        memTtl: 5,
        materialize: mockMaterialize
    });
    let promise = cache.get("one");
    expect(cache.get("one")).toBe(promise);
    yield expect(promise).resolves.toEqual({ data: "one sheep", metadata: { id: "one fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(1);
    expect(mockGetObject).toHaveBeenLastCalledWith({ Bucket: "test", Key: "one" });
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockPutObject).toHaveBeenLastCalledWith({ Bucket: "test", Key: "one", Body: "one sheep", Metadata: { id: "one fish" } });
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenLastCalledWith("one");
    yield expect(cache.get("one")).resolves.toEqual({ data: "one sheep", metadata: { id: "one fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(1);
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    promise = cache.get("two");
    expect(cache.get("two")).toBe(promise);
    yield expect(promise).resolves.toEqual({ data: "two sheep", metadata: { id: "two fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(2);
    expect(mockGetObject).toHaveBeenLastCalledWith({ Bucket: "test", Key: "two" });
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    yield expect(cache.get("two")).resolves.toEqual({ data: "two sheep", metadata: { id: "two fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(2);
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    Date.now = () => 5500;
    yield expect(cache.get("two")).resolves.toEqual({ data: "two sheep", metadata: { id: "two fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(2);
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    Date.now = () => 6500;
    yield expect(cache.get("two")).resolves.toEqual({ data: "two sheep", metadata: { id: "two fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(2);
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
    yield expect(cache.get("one")).resolves.toEqual({ data: "last sheep", metadata: { id: "last fish" } });
    expect(mockGetObject).toHaveBeenCalledTimes(3);
    expect(mockPutObject).toHaveBeenCalledTimes(1);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
}));
