import { describe, it } from "@jest/globals";
import fs from "fs";
import path from "path";
import { Installer, PackageJson, Updater } from "../../../src/index.js";
import { IntegrationTest } from "../IntegrationTest.js";

describe("Updater tests", () => {

    const integrationTest = new IntegrationTest("Updater");

    beforeAll(async () => {
        await integrationTest.init();
    });

    afterAll(async () => {
        await integrationTest.close();
    });

    it("Updating SPAM project", async () => {
        // Installing SPAM for tests
        const targetFolder = path.join(integrationTest.baseFolder, "node_modules");
        const packageJsonPath = path.join(integrationTest.baseFolder, "package.json");
        fs.copyFileSync("package.json", packageJsonPath);
        const packageJson = new PackageJson(packageJsonPath);
        const installer: Installer = new Installer(
            packageJson.definitions,
            targetFolder);
        await installer.install();
        // Running update
        const updater: Updater = new Updater(packageJsonPath, targetFolder);
        await updater.update();
    }, 300000);

}); 