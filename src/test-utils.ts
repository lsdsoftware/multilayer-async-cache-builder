import assert from "assert";

export function test(name: string, run: () => void) {
  console.log("Running test '%s'", name)
  run()
}

export function expect(a: unknown) {
  return {
    toBe(b: unknown) {
      assert.strictEqual(a, b)
    },
    toEqual(b: object) {
      assert.deepStrictEqual(a, b)
    }
  }
}
