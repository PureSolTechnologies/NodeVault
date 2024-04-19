import type { JestConfigWithTsJest } from 'ts-jest';
import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json";

const { compilerOptions } = tsconfig;


const config: JestConfigWithTsJest = {
  verbose: true,
  preset: "ts-jest/presets/default-esm",
  moduleFileExtensions: ["js", "json", "ts", "d.ts"],
  displayName: "Integration Tests: NodeVault",
  coverageDirectory: "coverage",
  collectCoverage: true,
  coverageProvider: "v8",
  coverageReporters: ["html", "lcov"],
  reporters: [
    "default",
    ["jest-junit", {
      "suiteName": "Integration Tests: NodeVault",
      "outputDirectory": ".",
      "outputName": "junit.integration.xml",
      "uniqueOutputName": "false",
      "classNameTemplate": "{classname}-{title}",
      "titleTemplate": "{classname}-{title}",
      "ancestorSeparator": " › ",
      "usePathForSuiteName": "true"
    }]
  ],
  testPathIgnorePatterns: [
    "node_modules/",
    "test/resources/",
    "test/unit/"
  ],
  detectOpenHandles: true,
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { useESM: true }),
  transform: {},
  extensionsToTreatAsEsm: [".jsx", ".ts", ".tsx"],
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts']
}

export default config;
