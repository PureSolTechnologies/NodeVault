import { describe, expect, it } from "@jest/globals";
import { PackageJson } from "../../../src/PackageJson.js";
import { DependencyTreeCreator } from "../../../src/tree/DependencyTreeCreator.js";
import { DependencyTreeOptimizer } from "../../../src/tree/DependencyTreeOptimizer.js";
import { IntegrationTest } from "../IntegrationTest.js";


describe("Tree optimizer tests", () => {

    let integrationTest = new IntegrationTest("DependencyTreeOptimizer");

    beforeAll(async () => {
        await integrationTest.init();
    })

    afterAll(async () => {
        await integrationTest.close();
    })

    it("Create tree from this project", async () => {
        const vault = integrationTest.vault!;
        const packageJson: PackageJson = new PackageJson("package.json");
        const creator = new DependencyTreeCreator(vault, integrationTest.baseFolder, false, false);
        const tree = await creator.createTree(packageJson.definitions);
        const optimizer = new DependencyTreeOptimizer(integrationTest.baseFolder);
        await optimizer.optimize(tree);
        expect(tree).toBeDefined();
    }, 300000);

});
