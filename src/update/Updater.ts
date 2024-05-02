import fs from "fs";
import log4js from 'log4js';
import path from "path";
import { DependencyNode, NodeModulesScanner, PackageJson, Vault, Version } from "../index.js";

/**
 * This class updates packages to the same version, but latest timestamp.
 */
export class Updater {

    private readonly logger = log4js.getLogger();
    private readonly vault = Vault.get();

    constructor(
        private readonly inputFile: string,
        readonly targetFolder: string
    ) {
    }

    public async update(): Promise<void> {
        const start = Date.now();
        // Check presence of package.json
        if (!fs.existsSync(this.inputFile)) {
            // Nothing to do here...
            throw Error(`No ${this.inputFile} found.`);
        }
        const packageJson = new PackageJson(this.inputFile);
        this.logger.info(`UPDATE started for '${packageJson.definitions.name}@${packageJson.definitions.version}'...`)
        const scanner = new NodeModulesScanner(this.inputFile);
        const root = await scanner.scan();
        for (let child of root.children) {
            await this.updateRecursively(child, this.targetFolder);
        }
        const end = Date.now();
        this.logger.info(`Installation took ${end - start}ms.`)
    }

    private async updateRecursively(node: DependencyNode, folder: string): Promise<void> {
        if (Version.of(node.packageJson.version).isSnapshot()) {
            await this.vault.install(node.packageJson, folder, this.targetFolder);
        }
        for (let child of node.children) {
            const childFolder = path.join(folder, node.targetPackage.name, "node_modules");
            await this.updateRecursively(child, childFolder);
        }
    }

}