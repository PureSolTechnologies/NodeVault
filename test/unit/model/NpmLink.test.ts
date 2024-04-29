import { describe, expect, test } from "@jest/globals";
import { NpmLink } from "../../../src/index.js";

describe("NPM link tests", () => {

    test("'npm:@jridgewell/resolve-uri@*'", () => {
        const link = new NpmLink("npm:@jridgewell/resolve-uri@*");
        expect(link.link).toBe("npm:@jridgewell/resolve-uri@*");
        expect(link.packageName).toBe("@jridgewell/resolve-uri");
        expect(link.versionRange.version).toBe("*");
    })

    test("'npm:string-width@^4.2.0'", () => {
        const link = new NpmLink("npm:string-width@^4.2.0");
        expect(link.link).toBe("npm:string-width@^4.2.0");
        expect(link.packageName).toBe("string-width");
        expect(link.versionRange.version).toBe("^4.2.0");
    })

});
