import { describe, expect, test } from "@jest/globals";
import { DependencyType } from "../../../src";
import { PackageJson } from "../../../src/index.js";

describe("PackageJson tests", () => {

    test("Initialization", () => {
        const packageJson = new PackageJson("package.json");
        expect(packageJson).toBeDefined();
        expect(packageJson.path).toBe("package.json");
        expect(packageJson.definitions).toBeDefined();
    });

    test("File link parsing", () => {
        const dependency = PackageJson.convertDependency("bson", "file:etc/eslint/no-bigint-usage", DependencyType.DEV);
        expect(dependency.name).toBe("bson");
        expect(dependency.type).toBe(DependencyType.DEV);
        expect(dependency.versionRange.toString()).toBe("etc/eslint/no-bigint-usage");
    });

});