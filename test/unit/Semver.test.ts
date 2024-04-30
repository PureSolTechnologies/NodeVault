import { describe, expect, test } from "@jest/globals";
import { Range, SemVer } from "semver";

describe("SemVer tests", () => {

    test("Parsing release version", () => {
        const ver: SemVer = new SemVer("1.2.3");
        expect(ver).toBeDefined()
        expect(ver.prerelease.length).toBe(0)
    });

    test("Parsing SNAPSHOT version", () => {
        const ver: SemVer = new SemVer("1.2.3-SNAPSHOT");
        expect(ver).toBeDefined()
        expect(ver.prerelease).toBeTruthy()
    });

    /**
     * This test was added to check the behavior of SemVer to cut the build meta information. 
     * We do not want to do that. The Version implementstion is fixing this. The need for the
     * fix is tested here.
     */
    test("parsing with full information", () => {
        const ver = new SemVer("6.0.14-unstable.3629a7b.0+3629a7");
        expect(ver.toString()).toBe("6.0.14-unstable.3629a7b.0")
    })

});

describe("SemVer Range tests", () => {

    test("Parsing range", () => {
        const range: Range = new Range("^1.2.3");
        expect(range).toBeDefined()
        range.includePrerelease
    });

    test("any matches", () => {
        const anyRange = new Range("*");
        expect(anyRange.intersects(new Range("0.0.0"))).toBeTruthy();
        expect(anyRange.intersects(new Range("10.1.1"))).toBeTruthy();
    });

    test("empty", () => {
        const anyRange = new Range("");
        expect(anyRange.intersects(new Range("=0.0.0"))).toBeTruthy();
        expect(anyRange.intersects(new Range("10.1.1"))).toBeTruthy();
    });

    test("exact matches", () => {
        const exactRange = new Range("1.2.3");
        expect(exactRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(exactRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(exactRange.intersects(new Range("1.2.4"))).toBeFalsy();
    });

    test("patch range", () => {
        const patchRange = new Range("~1.2.3");
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.5"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeFalsy();
    });

    test("minor range", () => {
        const patchRange = new Range("^1.2.3");
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.5"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.4.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("2.0.0"))).toBeFalsy();
    });

    // /*
    //  * Real version found in dependencies.
    //  */
    test("test '^7'", () => {
        const patchRange = new Range("^7");
        expect(patchRange.intersects(new Range("7.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("7.0.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("7.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("6.9.9"))).toBeFalsy();
        expect(patchRange.intersects(new Range("8.0.0"))).toBeFalsy();
    });

    // /*
    //  * Real version found in dependencies.
    //  */
    test("test '5'", () => {
        const patchRange = new Range("5");
        expect(patchRange.intersects(new Range("5.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("5.0.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("5.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("4.9.9"))).toBeFalsy();
        expect(patchRange.intersects(new Range("6.0.0"))).toBeFalsy();
    });


    test("test '0.x'", () => {
        const patchRange = new Range("0.x");
        expect(patchRange.intersects(new Range("0.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.0.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.9.9"))).toBeTruthy();
    });

    test("test '2.3.x'", () => {
        const patchRange = new Range("2.3.x");
        expect(patchRange.intersects(new Range("2.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("2.3.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("2.4.0"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.9.9"))).toBeFalsy();
    });

    test("test '3.x.x'", () => {
        const patchRange = new Range("3.x.x");
        expect(patchRange.intersects(new Range("3.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("3.1.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("4.0.0"))).toBeFalsy();
        expect(patchRange.intersects(new Range("2.9.9"))).toBeFalsy();
    });

    // /**
    //  * Actually found in dependencies.
    //  */
    test("test '0.3.x'", () => {
        const patchRange = new Range("0.3.x");
        expect(patchRange.intersects(new Range("0.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.3.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.4.0"))).toBeFalsy();
        expect(patchRange.intersects(new Range("0.2.9"))).toBeFalsy();
    });

    // /**
    //  * Actually found in dependencies.
    //  */
    test("test '>= 4.x'", () => {
        const patchRange = new Range(">= 4.x");
        expect(patchRange.intersects(new Range("4.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("4.0.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("4.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("5.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("3.9.9"))).toBeFalsy();
    });

    // /**
    //  * Actually found in dependencies.
    //  */
    test("test '0.*'", () => {
        const patchRange = new Range("0.*");
        expect(patchRange.intersects(new Range("0.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.2.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.0.0"))).toBeFalsy();
    });

    // /**
    //  * Actually found in dependencies.
    //  */
    test("test '0.3'", () => {
        const patchRange = new Range("0.3");
        expect(patchRange.intersects(new Range("0.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.3.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("0.4.0"))).toBeFalsy();
        expect(patchRange.intersects(new Range("0.2.9"))).toBeFalsy();
    });

    test("test '1.2.3 - 1.3.4'", () => {
        const patchRange = new Range("1.2.3 - 1.3.4");
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.3.5"))).toBeFalsy();
    });

    test("test '>=1.2.3 <=1.3.4'", () => {
        const patchRange = new Range(">=1.2.3 <=1.3.4");
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.3.5"))).toBeFalsy();
    });

    test("test '>=1.2.3'", () => {
        const patchRange = new Range(">=1.2.3");
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.3.5"))).toBeTruthy();
    });

    // /**
    //  * Found in actual dependency.
    //  */
    test("test '>= 1.2.3'", () => {
        const patchRange = new Range(">= 1.2.3");
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.2"))).toBeFalsy();
        expect(patchRange.intersects(new Range("1.3.5"))).toBeTruthy();
    });



    // /**
    //  * Found in actual dependency.
    //  */
    test("test '>=7.0.0-beta.0 <8'", () => {
        const patchRange = new Range(">=7.0.0-beta.0 <8");
        expect(patchRange.intersects(new Range("7.0.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("7.0.1"))).toBeTruthy();
        expect(patchRange.intersects(new Range("7.1.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("7.9.9"))).toBeTruthy();
        expect(patchRange.intersects(new Range("6.9.9"))).toBeFalsy();
    });

    // /**
    //  * Actual found dependency.
    //  */
    test("exact match: '=14.10.2-unbundled'", () => {
        const exactRange = new Range("=14.10.2-unbundled");
        expect(exactRange.intersects(new Range("14.10.1-unbundled"))).toBeFalsy();
        expect(exactRange.intersects(new Range("14.10.2-unbundled"))).toBeTruthy();
        expect(exactRange.intersects(new Range("14.10.3-unbundled"))).toBeFalsy();
    });

    test("test '<=1.3.4'", () => {
        const patchRange = new Range("<=1.3.4");
        expect(patchRange.intersects(new Range("1.2.3"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.0"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.4"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.2.2"))).toBeTruthy();
        expect(patchRange.intersects(new Range("1.3.5"))).toBeFalsy();
    });

    test("Multiple ranges", () => {
        const anyRange = new Range("~1.0.0||~1.2.0");
        expect(anyRange.intersects(new Range("1.0.0"))).toBeTruthy();
        expect(anyRange.intersects(new Range("1.0.1"))).toBeTruthy();
        expect(anyRange.intersects(new Range("1.2.0"))).toBeTruthy();
        expect(anyRange.intersects(new Range("1.2.1"))).toBeTruthy();
        expect(anyRange.intersects(new Range("1.3.0"))).toBeFalsy();
        expect(anyRange.intersects(new Range("1.1.0"))).toBeFalsy();
        expect(anyRange.intersects(new Range("0.9.9"))).toBeFalsy();
    });

});
