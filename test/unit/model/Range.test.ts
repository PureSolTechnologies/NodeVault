import { describe, expect, test } from "@jest/globals";
import { Range, Version } from '../../../src';

describe("Range tests", () => {

    test("Test contains", () => {
        const range = new Range(new Version(1, 0, 0), true, new Version(2, 0, 0), false);
        expect(range.contains(new Version(1, 0, 0))).toBeTruthy();
        expect(range.contains(new Version(1, 1, 0))).toBeTruthy();
        expect(range.contains(new Version(2, 0, 0))).toBeFalsy();
    });

});