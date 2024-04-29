import { describe, expect, test } from "@jest/globals";
import { FileLink } from "../../../src/index.js";

describe("FileLink tests", () => {

    test("./", () => {
        const link = new FileLink("./");
        expect(link.protocol).toBeUndefined();
        expect(link.path).toBe("./");
    })

})