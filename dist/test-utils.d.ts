export declare function test(name: string, run: () => void): void;
export declare function expect(a: unknown): {
    toBe(b: unknown): void;
    toEqual(b: object): void;
};
