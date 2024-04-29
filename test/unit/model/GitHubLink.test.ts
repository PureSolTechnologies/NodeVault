import { describe, expect, test } from "@jest/globals";
import { GitHubLink } from "../../../src";

describe("GitHub link tests", () => {

    test("'github:avajs/test'", () => {
        const link = new GitHubLink("github:avajs/test");
        expect(link.link).toBe("github:avajs/test");
        expect(link.path).toBe("avajs/test");
    })



    test("'davidbau/grunt-release'", () => {
        const link = new GitHubLink("davidbau/grunt-release");
        expect(link.link).toBe("davidbau/grunt-release");
        expect(link.path).toBe("davidbau/grunt-release");
    });


});