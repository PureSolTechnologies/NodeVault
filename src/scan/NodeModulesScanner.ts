import fs, { Dirent } from "fs";
import log4js from 'log4js';
import path from "path";
import { DependencyNode, Exception, Package, PackageJson, Version } from "../index.js";

export class NodeModulesScanner {

    private readonly logger = log4js.getLogger();

    constructor(private readonly inputFile: string) { }

    public async scan(): Promise<DependencyNode> {
        this.logger.info(`SCAN started for '${this.inputFile}...`)
        const root = await this.scanPackageJson(undefined, this.inputFile);
        this.logger.info("SCAN done.")
        return root;
    }

    public async scanAndExport(): Promise<void> {
        this.logger.info(`SCAN started for '${this.inputFile}...`)
        const root = await this.scanPackageJson(undefined, this.inputFile);
        await root.printTree("scanned-tree.log");
        const statistics = root.createStatistics();
        await DependencyNode.writeStatistics("scanned-statistics.log", statistics);
        this.logger.info("SCAN done.")
    }

    private async scanPackageJson(parent: DependencyNode | undefined, packageJsonFile: string): Promise<DependencyNode> {
        this.logger.info(`Creating node for '${packageJsonFile}'...`);
        // Check presence of package.json
        if (!fs.existsSync(packageJsonFile)) {
            // Nothing to do here...
            throw new Exception(`No ${packageJsonFile} found.`);
        }
        const packageJson = new PackageJson(packageJsonFile).definitions;
        const node = new DependencyNode(parent, packageJson, new Package(packageJson.name, Version.of(packageJson.version)));

        try {
            this.scanNodeModulesFolder(node, path.join(path.dirname(packageJsonFile), "node_modules"));
        } catch (e: any) {
            this.logger.error(`Error occurred: '${e.message}'`);
            console.error(`Error occurred: '${e.message}'`);
        }
        return node;
    }

    private scanNodeModulesFolder(node: DependencyNode, folder: string) {
        if (!fs.existsSync(folder)) {
            return;
        }
        this.logger.info(`Scanning '${folder}'...`);
        const entities: Dirent[] = fs.readdirSync(`${folder}`, { encoding: 'utf-8', recursive: false, withFileTypes: true });
        const sortedEntities = entities.sort((a, b) => a.name.localeCompare(b.name));
        for (let entity of sortedEntities) {
            if (entity.isDirectory()) {
                const packageFolder = path.join(folder, entity.name);
                if (entity.name.startsWith("@")) {
                    // Scope found. Handled as node_modules folder. Delegating...
                    this.scanNodeModulesFolder(node, packageFolder);
                } else {
                    const packageJsonFile = path.join(packageFolder, "package.json");
                    if (fs.existsSync(packageJsonFile)) {
                        this.scanPackageJson(node, packageJsonFile);
                    }
                }
            }
        }
    }

}