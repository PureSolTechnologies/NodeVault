import log4js from "log4js";
import { Exception, Utilities } from '../index.js';
import { DependencyNode, TotalsData } from "./index.js";

export interface OptimizerPackageMetaData {
    packageName: string;
    packageVersion: string;
    multipleVersions: boolean;
    usageCount: number;
}

export class DependencyTreeOptimizer {

    private readonly optimizerMetaData: Map<string, Map<string, OptimizerPackageMetaData>> = new Map<string, Map<string, OptimizerPackageMetaData>>();
    private logger = log4js.getLogger();

    constructor(
        readonly targetDirectory: string
    ) {
        Utilities.createFolder(targetDirectory);
    }

    private findMostUsed(statistics: Map<string, Map<string, TotalsData>>): TotalsData | undefined {
        let maxUsage: TotalsData | undefined = undefined;
        for (let packageName of statistics.keys()) {
            const versions = statistics.get(packageName)!;
            for (let packageVersion of versions.keys()) {
                const data = versions.get(packageVersion)!;
                if (maxUsage) {
                    if (maxUsage.count < data.count) {
                        maxUsage = data;
                    }
                } else {
                    maxUsage = data;
                }
            }
        }
        return maxUsage;
    }

    private removeHoistedDependencies(node: DependencyNode, isRootNode: boolean, remove: DependencyNode): void {
        if (!isRootNode) {
            if (node.hasChild(remove)) {
                node.removeChild(remove);
            }
        }
        for (let child of node.children) {
            this.removeHoistedDependencies(child, false, remove);
        }
    }

    private copyBranch(targetNode: DependencyNode, sourceNode: DependencyNode): void {
        /*
         * We create a new node on root node to move the dependency there.
         */
        const newNode = new DependencyNode(
            targetNode,
            sourceNode.packageJson,
            sourceNode.targetPackage
        )
        for (let child of sourceNode.children) {
            this.copyBranch(newNode, child);
        }
    }

    public async optimize(root: DependencyNode): Promise<void> {
        const start = Date.now();
        const statistics = root.createStatistics();
        await DependencyNode.writeStatistics(`${this.targetDirectory}/tree-statistics.log`, statistics);
        await this.optimizeSubTree(root);
        await root.printTree(`${this.targetDirectory}/optimized-tree.log`);
        const end = Date.now();
        this.logger.info(`Tree optimization took ${end - start}ms.`)
    }

    private async optimizeSubTree(node: DependencyNode): Promise<void> {
        const statistics = node.createStatistics();
        while (statistics.size > 0) {
            const mostUsed = this.findMostUsed(statistics);
            if (!mostUsed) {
                break;
            }
            this.logger.info(`Hoisting next '${mostUsed.packageName}@${mostUsed.packageVersion}'...`);
            const referenceNode = node.findChildByPackage(mostUsed.packageName, mostUsed.packageVersion);
            if (!referenceNode) { // in case of issues, there may not be a reference node
                throw new Exception(`No reference node for '${mostUsed.packageName}@${mostUsed.packageVersion}' found!`);
            }
            const potentialNode = node.findSpecificChild((node) => node.targetPackage.name === referenceNode.targetPackage.name);
            if (!potentialNode) {
                /*
                 * No package with same name is in current sub-tree root. So, 
                 * we hoist the reference node to the sub-tree root.
                 */
                this.logger.info(`Hoisting '${mostUsed.packageName}@${mostUsed.packageVersion}'...`);
                this.copyBranch(node, referenceNode!);
                this.logger.info(`Removing obsolete '${mostUsed.packageName}@${mostUsed.packageVersion}' dependencies...`);
                this.removeHoistedDependencies(node, true, referenceNode);
            } else if (potentialNode.targetPackage.version.toString() !== referenceNode.targetPackage.version.toString()) {
                this.logger.info(`Hoisting '${mostUsed.packageName}@${mostUsed.packageVersion}' not possible. Found ${potentialNode.targetPackage.name}@${potentialNode.targetPackage.version.toString()} in sub-tree root.`);
                this.logger.info(`Removing obsolete '${potentialNode.targetPackage.name}@${potentialNode.targetPackage.version.toString()}' dependencies...`);
                this.removeHoistedDependencies(node, true, potentialNode);
            } else {
                this.logger.warn(`Dependency '${mostUsed.packageName}@${mostUsed.packageVersion}' was already hoisted.`);
                this.logger.info(`Removing obsolete '${mostUsed.packageName}@${mostUsed.packageVersion}' dependencies...`);
                this.removeHoistedDependencies(node, true, referenceNode);
            }
            /*
             * Now we delete all other occurances from the tree.
             */
            const projectMetaData: Map<string, OptimizerPackageMetaData> = new Map<string, OptimizerPackageMetaData>();
            this.optimizerMetaData.set(mostUsed.packageName, projectMetaData);
            const packageTotals = statistics.get(mostUsed.packageName)!;
            for (let version of packageTotals.keys()) {
                const versionData = packageTotals.get(version)!;
                projectMetaData.set(version, {
                    packageName: versionData.packageName,
                    packageVersion: versionData.packageVersion,
                    multipleVersions: packageTotals.size > 0,
                    usageCount: versionData.count
                });
                this.logger.info(`Stats: ${versionData.packageName}@${versionData.packageVersion}\t${versionData.count}...`);
            }
            statistics.delete(mostUsed.packageName);
        }
        for (let child of node.children) {
            this.optimizeSubTree(child);
        }
    }
}
