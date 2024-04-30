import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import { NoVa } from "../../src";

describe("NoVa tests", () => {

    test("Home directory", () => {
        expect(NoVa.homeFolder).toBeDefined();
        expect(fs.existsSync(NoVa.homeFolder)).toBeTruthy();
        const homeStat = fs.statSync(NoVa.homeFolder);
        expect(homeStat.isDirectory()).toBeTruthy();
    });

    test("NoVa directory", () => {
        expect(NoVa.novaFolder).toBeDefined();
    });

    test("NoVa settings file", () => {
        expect(NoVa.settingsFile).toBeDefined();
    });

});