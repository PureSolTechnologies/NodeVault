import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";
import { Dependency, DependencyType, Installer, NpmLink, PackageJson, VersionRange } from "../../../src/index.js";
import { IntegrationTest } from "../IntegrationTest.js";

describe("Installer tests", () => {

    const integrationTest = new IntegrationTest("Installer");

    beforeAll(() => {
        integrationTest.init();
    })

    afterAll(() => {
        integrationTest.close();
    })

    it("Installing empty project", async () => {
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, path.join(integrationTest.baseFolder, "empty_node_modules"));
        await installer.install();
        // Simple smoke test
    }, 10000);

    it("Installing simple project (uuid@9.0.1)", async () => {
        const targetFolder = path.join(integrationTest.baseFolder, "uuid_node_modules");
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [new Dependency(DependencyType.PROD, "uuid", new VersionRange("9.0.1"))],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, targetFolder);
        await installer.install();
        expect(fs.existsSync(path.join(targetFolder, "uuid"))).toBeTruthy();
        expect(fs.existsSync(path.join(targetFolder, "uuid", "package.json"))).toBeTruthy();
        expect(fs.existsSync(path.join(targetFolder, ".bin", "uuid"))).toBeTruthy();
    }, 10000);

    it("Installing project with lifecycle script", async () => {
        const targetFolder = path.join(integrationTest.baseFolder, "node_modules");
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [new Dependency(DependencyType.PROD, "esbuild", new VersionRange("0.20.0"))],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, targetFolder);
        await installer.install();
        expect(fs.existsSync(path.join(targetFolder, "esbuild"))).toBeTruthy();
        expect(fs.existsSync(path.join(targetFolder, "esbuild", "package.json"))).toBeTruthy();
        expect(fs.existsSync(path.join(targetFolder, "esbuild", "lib", "downloaded-@esbuild-linux-x64-esbuild"))).toBeTruthy();
    }, 30000);

    it("Installing project with NPM link", async () => {
        const targetFolder = path.join(integrationTest.baseFolder, "string-width_node_modules");
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [new Dependency(DependencyType.PROD, "string-width-cjs", new NpmLink("npm:string-width@4.2.0"))],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, targetFolder);
        await installer.install();
        expect(fs.existsSync(path.join(targetFolder, "string-width-cjs"))).toBeTruthy();
        const packageJsonPath = path.join(targetFolder, "string-width-cjs", "package.json");
        expect(fs.existsSync(packageJsonPath)).toBeTruthy();
        const packageJson = new PackageJson(packageJsonPath);
        expect(packageJson.definitions.name).toEqual("string-width");
        expect(packageJson.definitions.version).toEqual("4.2.0");
    }, 300000);

    it("Installing semver", async () => {
        const targetFolder = path.join(integrationTest.baseFolder, "semver_node_modules");
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [new Dependency(DependencyType.PROD, "semver", new VersionRange("7.6.0"))],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, targetFolder);
        await installer.install();
        expect(fs.existsSync(path.join(targetFolder, "semver"))).toBeTruthy();
        const packageJsonPath = path.join(targetFolder, "semver", "package.json");
        expect(fs.existsSync(packageJsonPath)).toBeTruthy();
        const packageJson = new PackageJson(packageJsonPath);
        expect(packageJson.definitions.name).toEqual("semver");
        expect(packageJson.definitions.version).toEqual("7.6.0");
    }, 300000);

    it("Installing a module that doesnt exist (404 status codes) on nexus should abort", async () => {
        const targetFolder = path.join(integrationTest.baseFolder, "unknown_node_modules");
        const installer: Installer = new Installer({
            name: "InstallerTest",
            version: "1.0.0",
            bin: {},
            scripts: undefined,
            dependencies: [
                new Dependency(DependencyType.PROD, "project-that-doesnt-exist", new VersionRange("1.0.0")), // Project that doesn't exist
                new Dependency(DependencyType.PROD, "snapshot-that-doesnt-exist", new VersionRange("1.0.0-SNAPSHOT")), // Project that doesn't exist
            ],
            devDependencies: [],
            peerDependencies: [],
            optionalDependencies: []
        }, targetFolder);
        try {
            await installer.install();
            fail("Installer should have failed.")
        } catch (e: any) {
            // Intentionally kept blank
        }
    }, 300000);

    it("Installing NoVA project", async () => {
        const packageJson = new PackageJson("package.json");
        const installer: Installer = new Installer(
            packageJson.definitions,
            path.join(integrationTest.baseFolder, "nova_node_modules"));
        await installer.install();
        // Complex smoke test
    }, 300000);

}); 