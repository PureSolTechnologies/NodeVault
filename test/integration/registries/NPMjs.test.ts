import { describe, test } from "@jest/globals";
import path from "path";
import { NPMjs, Registry } from "../../../src/index.js";
import { IntegrationTest } from "../IntegrationTest.js";

describe("NPMjs tests", () => {

    const integrationTest = new IntegrationTest("NPMjs");

    let registry: Registry;

    beforeAll(() => {
        integrationTest.init();
        registry = new NPMjs();
    });

    afterAll(() => {
        integrationTest.close();
    });

    test("Read sample package info", async () => {
        await registry.downloadProjectMetaInfo("jest", path.join(integrationTest.baseFolder, "jest.tgz"));
    });

});