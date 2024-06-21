"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = test;
exports.expect = expect;
const assert_1 = __importDefault(require("assert"));
function test(name, run) {
    console.log("Running test '%s'", name);
    run();
}
function expect(a) {
    return {
        toBe(b) {
            assert_1.default.strictEqual(a, b);
        },
        toEqual(b) {
            assert_1.default.deepStrictEqual(a, b);
        }
    };
}
