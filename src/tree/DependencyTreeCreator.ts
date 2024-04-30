import { WriteStream } from "fs";
import log4js from 'log4js';
import { Dependency, Exception, Package, PackageJsonContent, Utilities, Vault, Version } from "../index.js";
import { DependencyNode } from "./index.js";

/**
 * This class creates a dependency tree. It will create a full tree without any
 * deduplication. It is like a cross-product over all dependencies.
 */
export class DependencyTreeCreator {

    private root: DependencyNode | undefined = undefined;
    private referenceNodes: Map<string, Map<string, DependencyNode>> = new Map();

    private treeLogStream: WriteStream | undefined = undefined;
    private readonly logger = log4js.getLogger();

    /**
     * 
     * @param vault is the vault to be used.
     * @param targetDirectory is the target node_modules folder. It is used in ths class for logging only.
     */
    constructor(
        private readonly vault: Vault,
        private readonly targetDirectory: string,
        private readonly enforcePackageJson: boolean,
        private readonly enforcedUpdates: boolean,
    ) {
        if (this.enforcedUpdates) {
            this.logger.info(`Tree creator will update local vault information.`);
        }
        this.logger.info(`Tree creator is using '${enforcePackageJson ? "package.json" : "meta-info.json"}'...`);
    }

    /**
     * This is the main method to start the tree creation.
     * @param packageJson 
    */
    public async createTree(packageJson: PackageJsonContent): Promise<DependencyNode> {
        const start = Date.now();
        Utilities.createFolder(this.targetDirectory);
        this.treeLogStream = await Utilities.createLogFile(`${this.targetDirectory}/tree.log`);
        try {
            this.root = new DependencyNode(
                undefined,
                packageJson,
                new Package(packageJson.name, Version.of(packageJson.version))
            );
            await this.createChildNodes(0, this.root, packageJson.dependencies);
            await this.createChildNodes(0, this.root, packageJson.devDependencies);
            await this.createChildNodes(0, this.root, packageJson.peerDependencies);
            await this.createChildNodes(0, this.root, packageJson.optionalDependencies);
        } finally {
            this.treeLogStream.close();
        }
        const end = Date.now();
        this.logger.info(`Tree creation took ${end - start}ms.`)
        return this.root;
    }

    private async createChildNodes(level: number, parent: DependencyNode, dependencies: Dependency[] | undefined): Promise<void> {
        if (dependencies) {
            for (let dependency of dependencies) {
                await this.createChildNode(level, parent, dependency);
            }
        }
    }

    /**
     * This method checks for cyclic dependencies which would lead to an endless loop. 
     * 
     * The check itself is simple: We check all the parents to be of the same type. If
     * it is the case, we have a cycle. The implementation is a simple recursion.
     * @param node is the current node to test.
     * @param packageName is the name of the package to be tested for. 
     * @param packageVersion is the version of the package to be tested for. 
     * @returns True is returned in case a cycle was found. False is returned otherwise.
     */
    private hasCycle(node: DependencyNode, targetPackage: Package): boolean {
        if (node.targetPackage.equals(targetPackage)) {
            return true;
        }
        if (node.parent) {
            return this.hasCycle(node.parent, targetPackage);
        }
        return false;
    }

    private copyReference(level: number, log: boolean, parent: DependencyNode, referenceNode: DependencyNode): void {
        if (log) {
            let indentation = Utilities.indent(level);
            this.treeLogStream!.write(`${indentation}* ${referenceNode.packageJson.name}@${referenceNode.packageJson.version}: ${referenceNode.targetPackage.toString()}`)
            this.treeLogStream!.write(" -> copying\n")
        }
        const child = new DependencyNode(
            parent,
            referenceNode.packageJson,
            referenceNode.targetPackage
        );
        for (let node of referenceNode.children) {
            this.copyReference(level + 1, true, child, node);
        }
    }

    private async createChildNode(level: number, parent: DependencyNode, dependency: Dependency): Promise<void> {
        this.treeLogStream!.write(`${Utilities.indent(level)}* ${dependency.name}/${dependency.versionRange}`)
        const targetPackage: Package | undefined = await this.vault.getLatestMatchingVersion(dependency, this.enforcedUpdates);
        if (!targetPackage) {
            this.treeLogStream!.write(" / warn: No matching version\n")
            this.logger.warn(`No matching version was found for '${dependency.toString()}'.`)
            return;
        }
        this.treeLogStream!.write(`: ${targetPackage.toString()}`)
        if (this.hasCycle(parent, targetPackage)) {
            this.logger.warn(`Cyclic dependency found for '${dependency.name}@${dependency.versionRange}' (${dependency.type})`);
            this.treeLogStream!.write(" CYCLE FOUND!\n")
            return;
        }
        try {
            if (!this.hasReferenceNode(targetPackage)) {
                this.treeLogStream!.write(" -> adding\n")
                let packageJson: PackageJsonContent;
                if (this.enforcePackageJson) {
                    packageJson = (await this.vault.readPackageJson(targetPackage)).definitions;
                } else {
                    packageJson = (await this.vault.readPackageJsonFromLatestSource(targetPackage, this.enforcedUpdates));
                }
                const child = new DependencyNode(parent, packageJson, targetPackage);
                this.registerReferenceNode(targetPackage, child);
                await this.createChildNodes(level + 1, child, packageJson.dependencies);
                //await this.createChildNodes(level + 1, child, packageJson.devDependencies);
                //await this.createChildNodes(level + 1, child, packageJson.peerDependencies);
                //await this.createChildNodes(level + 1, child, packageJson.optionalDependencies);
            } else {
                this.treeLogStream!.write(" -> re-using\n")
                this.copyReference(level + 1, false, parent, this.getReferenceNode(targetPackage));
            }
        } catch (e: any) {
            this.logger.error(`Could not create child node for '${dependency.toString()}: ${e.message}'`);
            if (e instanceof Exception) {
                this.treeLogStream!.write(` / error: ${e.toString()}\n`)
                throw e;
            } else {
                this.treeLogStream!.write(` / error: ${e.message}\n`)
                throw new Exception(e.message, e);
            }
        }
    }

    private registerReferenceNode(targetPackage: Package, referenceNode: DependencyNode): void {
        const packageName = targetPackage.name;
        const packageVersion = targetPackage.version.toString();
        let packageReferences = this.referenceNodes.get(packageName);
        if (!packageReferences) {
            packageReferences = new Map<string, DependencyNode>();
            this.referenceNodes.set(packageName, packageReferences);
        }
        if (packageReferences.has(packageVersion)) {
            throw new Exception(`Package ${packageName}@${packageVersion} was already registered.`);
        }
        packageReferences.set(packageVersion, referenceNode);
    }

    private getReferenceNode(targetPackage: Package): DependencyNode {
        const packageName = targetPackage.name;
        const packageVersion = targetPackage.version.toString();
        const packageReferences = this.referenceNodes.get(packageName);
        if (!packageReferences) {
            throw new Exception(`No reference node for '${packageName}@${packageVersion}' was found!`);
        }
        const referenceNode = packageReferences.get(packageVersion);
        if (!referenceNode) {
            throw new Exception(`No reference node for '${packageName}@${packageVersion}' was found!`);
        }
        return referenceNode;
    }

    private hasReferenceNode(targetPackage: Package): boolean {
        const packageName = targetPackage.name;
        const packageVersion = targetPackage.version.toString();
        const packageReferences = this.referenceNodes.get(packageName);
        if (!packageReferences) {
            return false;
        }
        const referenceNode = packageReferences.get(packageVersion);
        if (!referenceNode) {
            return false;
        }
        return true;
    }
}
