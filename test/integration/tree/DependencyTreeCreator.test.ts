import { describe, expect, it } from "@jest/globals";
import { PackageJson, PackageJsonContent } from "../../../src/PackageJson.js";
import { Dependency, DependencyType, Package, Version, VersionRange } from "../../../src/index.js";
import { DependencyTreeCreator } from "../../../src/tree/DependencyTreeCreator.js";
import { IntegrationTest } from "../IntegrationTest.js";

describe("Tree Creator tests", () => {

    let integrationTest = new IntegrationTest("DependencyTreeCreator");

    beforeAll(async () => {
        await integrationTest.init();
    })

    afterAll(async () => {
        await integrationTest.close();
    })

    it("No dependencies", async () => {
        const vault = integrationTest.vault!;
        const treeCreator = new DependencyTreeCreator(vault, integrationTest.baseFolder, false, false);
        const packageJson: PackageJsonContent = {
            name: "test",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        };
        const tree = await treeCreator.createTree(packageJson);
        expect(tree).toBeDefined();
        expect(tree.packageJson).toEqual(packageJson);
        expect(tree.targetPackage).toEqual(new Package("test", Version.of("1.0.0")));
        expect(tree.parent).toBeUndefined();
        expect(tree.children).toHaveLength(0);
    }, 10000);

    it("Create tree", async () => {
        const vault = integrationTest.vault!;
        const treeCreator = new DependencyTreeCreator(vault, integrationTest.baseFolder, false, false);
        const packageJson: PackageJsonContent = {
            name: "test",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [
                new Dependency(DependencyType.PROD, "uuid", new VersionRange("^9.0.1"))
            ],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        };
        const tree = await treeCreator.createTree(packageJson);
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].parent).toEqual(tree);
    }, 30000);

    it("Create tree from this project", async () => {
        const vault = integrationTest.vault!;
        const packageJson: PackageJson = new PackageJson("package.json");
        const tree = new DependencyTreeCreator(vault, integrationTest.baseFolder, false, false);
        await tree.createTree(packageJson.definitions);
        expect(tree).toBeDefined();
    }, 300000);

});
