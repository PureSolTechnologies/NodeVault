import { describe, expect, test } from "@jest/globals";
import { GitLink } from "../../../src/index.js";

describe("GitLink tests", () => {

    test("Full URL", () => {
        const link: GitLink = new GitLink("git+ssh://user:password@hostname:1234:/path/to/resource");
        expect(link.protocol).toBe("git+ssh");
        expect(link.user).toBe("user");
        expect(link.password).toBe("password");
        expect(link.hostname).toBe("hostname");
        expect(link.port).toBe("1234");
        expect(link.path).toBe("/path/to/resource");
    });

});