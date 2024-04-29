import { PathLike } from 'fs';
import { Utilities } from './Utilities.js';
import { Dependency } from "./model/Dependency.js";
import { DependencyType } from './model/DependencyType.js';
import { FileLink } from './model/FileLink.js';
import { GitHubLink } from './model/GitHubLink.js';
import { NpmLink } from './model/NpmLink.js';
import { VersionRange } from './model/VersionRange.js';

/**
 * This interface represents the important package.json content.
 */
export interface PackageJsonContent {
    name: string;
    version: string;
    bin: { [key: string]: string } | string | undefined,
    scripts: { [key: string]: string } | undefined,
    dependencies: Dependency[] | undefined;
    devDependencies: Dependency[] | undefined;
    peerDependencies: Dependency[] | undefined;
    optionalDependencies: Dependency[] | undefined;
}

export class PackageJson {

    public static convertDependency(packageName: any, packageVersion: string, dependencyType: DependencyType): Dependency {
        if (packageVersion.startsWith("github:")) {
            return new Dependency(
                dependencyType,
                packageName,
                new GitHubLink(packageVersion)
            );
        } else if (packageVersion.startsWith("file:") || packageVersion.startsWith(".")) {
            return new Dependency(
                dependencyType,
                packageName,
                new FileLink(packageVersion)
            );
        } else if (/\S+\/\S+/g.exec(packageVersion)) {
            return new Dependency(
                dependencyType,
                packageName,
                new GitHubLink(packageVersion)
            );
        } else if (packageVersion.startsWith("npm:")) {
            const link = new NpmLink(packageVersion);
            return new Dependency(
                dependencyType,
                packageName,
                link
            );
        } else {
            return new Dependency(
                dependencyType,
                packageName,
                new VersionRange(packageVersion)
            );
        }
    }

    public static convertDependencies(dependencies: any | undefined, dependencyType: DependencyType): Dependency[] | undefined {
        if (dependencies) {
            const converted: Dependency[] = []
            for (let dependency in dependencies) {
                converted.push(PackageJson.convertDependency(dependency, dependencies[dependency], dependencyType));
            }
            return converted;
        } else {
            return undefined;
        }
    }

    readonly definitions: PackageJsonContent;

    constructor(readonly path: PathLike) {
        const raw = Utilities.readFileToJson(path);

        const dependencies: Dependency[] | undefined = PackageJson.convertDependencies(raw.dependencies, DependencyType.PROD);
        const devDependencies: Dependency[] | undefined = PackageJson.convertDependencies(raw.devDependencies, DependencyType.DEV);
        const peerDependencies: Dependency[] | undefined = PackageJson.convertDependencies(raw.peerDependencies, DependencyType.PEER);
        const optionalDependencies: Dependency[] | undefined = PackageJson.convertDependencies(raw.optionalDependencies, DependencyType.OPTIONAL);

        this.definitions = {
            name: raw.name,
            version: raw.version,
            bin: raw.bin ? raw.bin : undefined,
            scripts: raw.scripts,
            dependencies,
            devDependencies,
            peerDependencies,
            optionalDependencies
        }
    }
}