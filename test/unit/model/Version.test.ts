import { describe, expect, test } from "@jest/globals";
import { Version } from "../../../src/model/index.js";

describe("Version RecExp tests", () => {

    test("'1.2.3'", () => {
        const version: Version = Version.of("1.2.3");
        expect(version.major).toBe(1);
        expect(version.minor).toBe(2);
        expect(version.patch).toBe(3);
        expect(version.isSnapshot()).toBeFalsy();
        expect(version.toString()).toBe("1.2.3");

    });

    test("'2.3.4-SNAPSHOT'", () => {
        const version: Version = Version.of("2.3.4-SNAPSHOT");
        expect(version.major).toBe(2);
        expect(version.minor).toBe(3);
        expect(version.patch).toBe(4);
        expect(version.isSnapshot()).toBeTruthy();
        expect(version.toString()).toBe("2.3.4-SNAPSHOT");
    });

    /*
     * This version was actually found in this project's dependency tree.
     */
    test("'7'", () => {
        const version: Version = Version.of("7");
        expect(version.major).toBe(7);
        expect(version.minor).toBe(0);
        expect(version.patch).toBe(0);
        expect(version.isSnapshot()).toBeFalsy();
        expect(version.toString()).toBe("7.0.0");
    });

    /*
     * This version was actually found in this project's dependency tree.
     */
    test("'6.0.14-unstable.3629a7b.0+3629a7b'", () => {
        const version: Version = Version.of("6.0.14-unstable.3629a7b.0+3629a7b");
        expect(version.major).toBe(6);
        expect(version.minor).toBe(0);
        expect(version.patch).toBe(14);
        expect(version.prerelease).toEqual(["unstable", "3629a7b", 0]);
        expect(version.build).toEqual(["3629a7b"]);
        expect(version.isSnapshot()).toBeFalsy();
        expect(version.toString()).toBe("6.0.14-unstable.3629a7b.0+3629a7b");
    });

    /*
     * This version was actually found in this project's dependency tree.
     */
    test("'6.0.14-unstable.3629a7b.0+3629a7b.2ndBuildPart'", () => {
        const version: Version = Version.of("6.0.14-unstable.3629a7b.0+3629a7b.2ndBuildPart");
        expect(version.major).toBe(6);
        expect(version.minor).toBe(0);
        expect(version.patch).toBe(14);
        expect(version.prerelease).toEqual(["unstable", "3629a7b", 0]);
        expect(version.build).toEqual(["3629a7b", "2ndBuildPart"]);
        expect(version.isSnapshot()).toBeFalsy();
        expect(version.toString()).toBe("6.0.14-unstable.3629a7b.0+3629a7b.2ndBuildPart");
    });

});


describe("Version comparison tests", () => {

    test("equals", () => {
        expect(new Version(1, 2, 3).equals(new Version(1, 2, 3))).toBeTruthy();
        expect(new Version(2, 3, 4, "SNAPSHOT").equals(new Version(2, 3, 4, "SNAPSHOT"))).toBeTruthy();
        expect(new Version(2, 3, 4).equals(new Version(2, 3, 4, "SNAPSHOT"))).toBeFalsy();
        expect(new Version(1, 2, 3).equals(new Version(1, 2, 4))).toBeFalsy();
        expect(new Version(1, 2, 3).equals(new Version(1, 3, 3))).toBeFalsy();
        expect(new Version(1, 2, 3).equals(new Version(2, 2, 3))).toBeFalsy();
        expect(new Version(1, 2, 3).equals(undefined)).toBeFalsy();
        expect(new Version(1, 2, 3).equals("This is a string.")).toBeFalsy();
    });

    test("compare", () => {
        expect(new Version(1, 2, 3).compare(new Version(1, 2, 3, "SNAPSHOT"))).toBe(1);
        expect(new Version(1, 2, 3).compare(new Version(1, 2, 3))).toBe(0);
        expect(new Version(1., 2, 3, "SNAPSHOT").compare(new Version(1, 2, 3))).toBe(-1);

        expect(new Version(1, 2, 3).compare(new Version(1, 2, 4))).toBe(-1);
        expect(new Version(1, 2, 3).compare(new Version(1, 2, 2))).toBe(1);

        expect(new Version(1, 2, 3).compare(new Version(1, 3, 3))).toBe(-1);
        expect(new Version(1, 2, 3).compare(new Version(1, 1, 3))).toBe(1);

        expect(new Version(1, 2, 3).compare(new Version(2, 2, 3))).toBe(-1);
        expect(new Version(1, 2, 3).compare(new Version(0, 2, 3))).toBe(1);
    });

    test("compare pre-releases", () => {
        expect(new Version(1, 2, 3, "alpha").compare(new Version(1, 2, 3, "beta"))).toBe(-1);
        expect(new Version(1, 2, 3, "beta").compare(new Version(1, 2, 3, "alpha"))).toBe(1);
        expect(new Version(1, 2, 3, "beta").compare(new Version(1, 2, 3))).toBe(-1);
        expect(new Version(1, 2, 3).compare(new Version(1, 2, 3, "beta"))).toBe(1);
        expect(new Version(1, 2, 3, "beta").compare(new Version(1, 2, 3, "beta"))).toBe(0);
    });

});