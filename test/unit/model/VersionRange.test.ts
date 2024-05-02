import { describe, expect, test } from "@jest/globals";
import { Version, VersionRange } from "../../../src/model/index.js";

describe("Version Range tests", () => {

    test("any matches", () => {
        const anyRange = new VersionRange("*");
        expect(anyRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(10, 1, 1))).toBeTruthy();
    });

    test("empty", () => {
        const anyRange = new VersionRange("");
        expect(anyRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(10, 1, 1))).toBeTruthy();
    });

    /**
     * Actual tag found in version range in dependency.
     */
    test("next", () => {
        const anyRange = new VersionRange("next");
        expect(anyRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(10, 1, 1))).toBeTruthy();
    });

    test("latest", () => {
        const anyRange = new VersionRange("latest");
        expect(anyRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(10, 1, 1))).toBeTruthy();
    });

    test("exact matches", () => {
        const exactRange = new VersionRange("1.2.3");
        expect(exactRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(exactRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(exactRange.contains(new Version(1, 2, 4))).toBeFalsy();
    });

    test("patch range", () => {
        const patchRange = new VersionRange("~1.2.3");
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 5))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeFalsy();
    });

    test("minor range", () => {
        const patchRange = new VersionRange("^1.2.3");
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 5))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 4, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(2, 0, 0))).toBeFalsy();
    });

    test("minor range '^29.0.0", () => {
        const patchRange = new VersionRange("^29.0.0");
        expect(patchRange.contains(new Version(28, 9, 9))).toBeFalsy();
        expect(patchRange.contains(new Version(29, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(29, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(29, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(30, 0, 0))).toBeFalsy();
        expect(patchRange.contains(Version.of("30.0.0-alpha.3"))).toBeFalsy();
    });

    /*
     * Real version found in dependencies.
     */
    test("test '^7'", () => {
        const patchRange = new VersionRange("^7");
        expect(patchRange.contains(new Version(7, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(7, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(7, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(6, 9, 9))).toBeFalsy();
        expect(patchRange.contains(new Version(8, 0, 0))).toBeFalsy();
    });

    /*
     * Real version found in dependencies.
     */
    test("test '5'", () => {
        const patchRange = new VersionRange("5");
        expect(patchRange.contains(new Version(5, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(5, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(5, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(4, 9, 9))).toBeFalsy();
        expect(patchRange.contains(new Version(6, 0, 0))).toBeFalsy();
    });


    test("test '0.x'", () => {
        const patchRange = new VersionRange("0.x");
        expect(patchRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 9, 9))).toBeTruthy();
    });

    test("test '2.3.x'", () => {
        const patchRange = new VersionRange("2.3.x");
        expect(patchRange.contains(new Version(2, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(2, 3, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(2, 4, 0))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 9, 9))).toBeFalsy();
    });

    test("test '3.x.x'", () => {
        const patchRange = new VersionRange("3.x.x");
        expect(patchRange.contains(new Version(3, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(3, 1, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(4, 0, 0))).toBeFalsy();
        expect(patchRange.contains(new Version(2, 9, 9))).toBeFalsy();
    });

    /**
     * Actually found in dependencies.
     */
    test("test '0.3.x'", () => {
        const patchRange = new VersionRange("0.3.x");
        expect(patchRange.contains(new Version(0, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 3, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 4, 0))).toBeFalsy();
        expect(patchRange.contains(new Version(0, 2, 9))).toBeFalsy();
    });

    /**
     * Actually found in dependencies.
     */
    test("test '>= 4.x'", () => {
        const patchRange = new VersionRange(">= 4.x");
        expect(patchRange.contains(new Version(4, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(4, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(4, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(5, 0, 0))).toBeFalsy();
        expect(patchRange.contains(new Version(3, 9, 9))).toBeFalsy();
    });

    /**
     * Actually found in dependencies.
     */
    test("test '0.*'", () => {
        const patchRange = new VersionRange("0.*");
        expect(patchRange.contains(new Version(0, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 2, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 0, 0))).toBeFalsy();
    });

    /**
     * Actually found in dependencies.
     */
    test("test '0.3'", () => {
        const patchRange = new VersionRange("0.3");
        expect(patchRange.contains(new Version(0, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 3, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(0, 4, 0))).toBeFalsy();
        expect(patchRange.contains(new Version(0, 2, 9))).toBeFalsy();
    });

    test("test '1.2.3 - 1.3.4'", () => {
        const patchRange = new VersionRange("1.2.3 - 1.3.4");
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 3, 5))).toBeFalsy();
    });

    test("test '>=1.2.3 <=1.3.4'", () => {
        const patchRange = new VersionRange(">=1.2.3 <=1.3.4");
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 3, 5))).toBeFalsy();
    });

    test("test '>=1.2.3'", () => {
        const patchRange = new VersionRange(">=1.2.3");
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 3, 5))).toBeTruthy();
    });

    /**
     * Found in actual dependency.
     */
    test("test '>= 1.2.3'", () => {
        const patchRange = new VersionRange(">= 1.2.3");
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 2))).toBeFalsy();
        expect(patchRange.contains(new Version(1, 3, 5))).toBeTruthy();
    });



    /**
     * Found in actual dependency.
     */
    test("test '>=7.0.0-beta.0 <8'", () => {
        const patchRange = new VersionRange(">=7.0.0-beta.0 <8");
        expect(patchRange.contains(new Version(7, 0, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(7, 0, 1))).toBeTruthy();
        expect(patchRange.contains(new Version(7, 1, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(7, 9, 9))).toBeTruthy();
        expect(patchRange.contains(new Version(6, 9, 9))).toBeFalsy();
    });

    /**
     * Actual found dependency.
     */
    test("exact match: '=14.10.2-unbundled'", () => {
        const exactRange = new VersionRange("=14.10.2-unbundled");
        expect(exactRange.contains(new Version(14, 10, 1, "unbundled"))).toBeFalsy();
        expect(exactRange.contains(new Version(14, 10, 2, "unbundled"))).toBeTruthy();
        expect(exactRange.contains(new Version(14, 10, 3, "unbundled"))).toBeFalsy();
    });

    test("test '<=1.3.4'", () => {
        const patchRange = new VersionRange("<=1.3.4");
        expect(patchRange.contains(new Version(1, 2, 3))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 0))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 4))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 2, 2))).toBeTruthy();
        expect(patchRange.contains(new Version(1, 3, 5))).toBeFalsy();
    });

    test("Multiple ranges", () => {
        const anyRange = new VersionRange("~1.0.0||~1.2.0");
        expect(anyRange.contains(new Version(1, 0, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(1, 0, 1))).toBeTruthy();
        expect(anyRange.contains(new Version(1, 2, 0))).toBeTruthy();
        expect(anyRange.contains(new Version(1, 2, 1))).toBeTruthy();
        expect(anyRange.contains(new Version(1, 3, 0))).toBeFalsy();
        expect(anyRange.contains(new Version(1, 1, 0))).toBeFalsy();
        expect(anyRange.contains(new Version(0, 9, 9))).toBeFalsy();
    });

});

describe("VersionRange of() tests", () => {

    test("'1.6.0-SNAPSHOT'", () => {
        const range = new VersionRange("1.6.0-SNAPSHOT");
        expect(range).toBeDefined()
    });

});