import { describe, expect, it } from "@jest/globals";
import { CLI } from "../../src/CLI.js";
import { VersionAction } from "../../src/index.js";
import { NOVA_VERSION } from "../../src/version/version.js";

describe("CLI tests", () => {

    it("Abort without command", async () => {
        const cli = new CLI();
        expect(await cli.execute()).toBeFalsy();
        expect(process.exitCode).not.toBe(0);
        process.exitCode = 0; // CommandLineParser sets the exitCode to 2 because wrong arguments were called. https://github.com/jestjs/jest/issues/14501
    });

    it("Should provide the version number", async () => {
        const cli = new CLI();
        expect(await cli.execute(["version"])).toBeTruthy();
        expect(cli.selectedAction).toBeDefined();
        expect(cli.selectedAction!.actionName).toEqual('version');
        const action: VersionAction = cli.selectedAction as VersionAction;
        expect(action.version).toBe(NOVA_VERSION);
    }, 10000);

    it("Scan NoVa", async () => {
        const cli = new CLI();
        expect(await cli.execute(["scan"])).toBeTruthy();
        expect(cli.selectedAction).toBeDefined();
        expect(cli.selectedAction!.actionName).toEqual('scan');
    }, 10000);

});