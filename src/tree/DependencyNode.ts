import { WriteStream } from "fs";
import { Package, PackageJsonContent, Utilities } from "../index.js";
import { AbstractTreeNode } from "./AbstractTreeNode.js";
import { TotalsData } from "./TotalsData.js";

/**
 * This class represents a single node in the dependency tree.
 */
export class DependencyNode extends AbstractTreeNode<DependencyNode> {

    constructor(
        parent: DependencyNode | undefined,
        /**
         * Content of the package.json of the defining dependency. It can be 
         * found in the corresponding folder of the dependency. 
         */
        public readonly packageJson: PackageJsonContent,
        public readonly targetPackage: Package) {
        super(parent);
    }

    public equals(other: DependencyNode): boolean {
        return (this.packageJson.name === other.packageJson.name)
            && (this.packageJson.version === other.packageJson.version)
            && (this.targetPackage.equals(other.targetPackage));
    }

    public findChild(other: DependencyNode): DependencyNode | undefined {
        return DependencyNode.findChildRecursive(this, other);
    }

    public static findChildRecursive(node: DependencyNode, other: DependencyNode): DependencyNode | undefined {
        if (node.equals(other)) {
            return node;
        }
        for (let child of node.children) {
            const found = DependencyNode.findChildRecursive(child, other);
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    public findChildByPackage(packageName: string, packageVersion: string): DependencyNode | undefined {
        return DependencyNode.findChildByPackageRecursive(this, packageName, packageVersion);
    }

    public static findChildByPackageRecursive(node: DependencyNode, packageName: string, packageVersion: string): DependencyNode | undefined {
        if (
            node.targetPackage.name === packageName
            && (node.targetPackage.version.toString() === packageVersion)
        ) {
            return node;
        }
        for (let child of node.children) {
            const found = DependencyNode.findChildByPackageRecursive(child, packageName, packageVersion);
            if (found) {
                return found;
            }
        }
        return undefined;
    }

    public createStatistics(): Map<string, Map<string, TotalsData>> {
        const statistics: Map<string, Map<string, TotalsData>> = new Map<string, Map<string, TotalsData>>();
        /*
         * Do not count this as it is not a dependency and also to avoid an
         * endless loop when it tries to hoist itself.
         */
        for (let child of this.children) {
            DependencyNode.createStatisticsRecursive(child, statistics);
        }
        return statistics;
    }

    public static createStatisticsRecursive(node: DependencyNode, statistics: Map<string, Map<string, TotalsData>>): void {
        const packageName = node.targetPackage.name;
        const packageVersion = node.targetPackage.version.toString();
        let projectTotals = statistics.get(packageName);
        if (!projectTotals) {
            projectTotals = new Map<string, TotalsData>();
            statistics.set(packageName, projectTotals);
        }
        let versionTotals: TotalsData | undefined = projectTotals.get(packageVersion);
        if (!versionTotals) {
            versionTotals = {
                packageName,
                packageVersion,
                count: 1
            }
            projectTotals.set(packageVersion, versionTotals);
        } else {
            versionTotals.count++;
        }
        for (let child of node.children) {
            DependencyNode.createStatisticsRecursive(child, statistics);
        }
    }


    public async printTree(outputFile: string): Promise<void> {
        return new Promise(async (approve, reject) => {
            const treeLogStream = await Utilities.createLogFile(outputFile);
            treeLogStream.on("finish", () => {
                treeLogStream.close();
                approve();
            });
            try {
                await DependencyNode.printTreeNode(treeLogStream, 0, this);
            } finally {
                treeLogStream.end();
            }
        });
    }

    private static async printTreeNode(stream: WriteStream, level: number, node: DependencyNode): Promise<void> {
        let indentation = Utilities.indent(level);
        stream.write(`${indentation}* ${node.packageJson.name}@${node.packageJson.version} -> ${node.targetPackage.version.toString()}`);
        stream.write('\n');

        const sortedChildren = node.children.sort((a, b) => a.packageJson.name.localeCompare(b.packageJson.name));
        for (let child of sortedChildren) {
            await this.printTreeNode(stream, level + 1, child);
        }
    }

    public static async writeStatistics(fileName: string, statistics: Map<string, Map<string, TotalsData>>): Promise<void> {
        const statStream: WriteStream = await Utilities.createLogFile(fileName);
        const sortedKeys = Array.from(statistics.keys()).sort();
        for (let packageName of sortedKeys) {
            const sortedVersions = Array.from(statistics.get(packageName)!.keys()).sort();
            for (let packageVersion of sortedVersions) {
                const stat = statistics.get(packageName)!.get(packageVersion)!;
                statStream.write(`${packageName}\t${packageVersion}\t${stat.count}\n`)
            }
        }
        Utilities.closeLogFile(statStream);
    }

}
