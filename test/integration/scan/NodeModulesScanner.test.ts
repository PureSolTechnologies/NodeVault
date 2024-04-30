import { describe, it } from "@jest/globals";
import { NodeModulesScanner } from "../../../src";
import { IntegrationTest } from "../IntegrationTest";

describe("NodeModulesScanner tests", () => {

    let integrationTest = new IntegrationTest("NodeModulesScannerTest");

    beforeAll(async () => {
        await integrationTest.init();
    })

    afterAll(async () => {
        await integrationTest.close();
    })

    it("Scan NoVa", async () => {
        const action = new NodeModulesScanner("package.json");
        action.scan();
    }, 10000);


});