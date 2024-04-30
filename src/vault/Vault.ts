import { exec, execSync } from "child_process";
import fs, { Dirent, PathLike } from 'fs';
import log4js from 'log4js';
import { join, normalize } from "path";
import { Exception } from "../Exception.js";
import { PackageJsonContent } from "../PackageJson.js";
import { Utilities } from '../Utilities.js';
import { Dependency, DependencyType, FileLink, GitLink, Nexus, PackageJson, VersionOrLinkType, VersionRange } from '../index.js';
import { GitHubLink } from '../model/GitHubLink.js';
import { NpmLink } from "../model/NpmLink.js";
import { Package } from "../model/Package.js";
import { Version } from '../model/Version.js';
import { Lifecycle } from "./Lifecycle.js";
import { ProjectMetaInfo, VersionInformation } from './ProjectMetaInfo.js';

/**
 * This class manages the local vault with the cached packages and handles updates.
 */
export class Vault {

    private static readonly META_DATA_UPDATE_PERIOD: number = 3600 * 24 * 1000; // 24hr in Milliseconds

    private static instance: Vault | undefined = undefined;

    /**
     * Initializes the Vault singleton with the given parameters.
     * @param registry is the registry to use.
     * @param novaFolder is the NoVa folder for finding the vault folder (<nova folder>/vaultV).
     * @returns The singleton instance is returned.
     */
    public static init(registry: Nexus, novaFolder: string): Vault {
        if (Vault.instance) {
            throw new Exception("Vault was already initialized!");
        }
        Vault.instance = new Vault(registry, novaFolder);
        return Vault.instance;
    }

    public static shutdown(): void {
        if (!Vault.instance) {
            throw new Exception("Vault was not yet initialized.");
        }
        Vault.instance = undefined;
    }

    /**
     * @returns The singleton instance is returned. If not initialized, an exception is thrown.
     */
    public static get(): Vault {
        if (!Vault.instance) {
            throw new Exception("Vault was not yet initialized.");
        }
        return Vault.instance;
    }

    private readonly vaultFolder: string;
    private readonly logger = log4js.getLogger();

    private constructor(private readonly registry: Nexus, novaFolder: string) {
        this.vaultFolder = join(novaFolder, "vault");
        this.createVaultFolder();
    }

    /**
     * Checks whether a resource is outdated and needs updating.
     * @param path is the file to be checked.
     * @returns True is returned if the file is outdate. False is returned 
     * otherwise.
     */
    private isOutdated(path: PathLike): boolean {
        const age = Date.now() - fs.statSync(path).mtime.getTime();
        if (age < Vault.META_DATA_UPDATE_PERIOD) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Create the vault directory in case it is needed.
     */
    private createVaultFolder(): void {
        if (!fs.existsSync(this.vaultFolder)) {
            this.logger.info(`Vault folder '${this.vaultFolder}' does not exist. Creating a new vault from scratch...`);
            fs.mkdirSync(this.vaultFolder, { recursive: true });
            this.logger.info(`Folder '${this.vaultFolder}' created.`);
        }
    }

    /**
     * This method calculates the folder for the project inside the vault.
     * @param projectName is the name of the project.
     * @returns  A path to the project folder inside the vault.
     */
    private getProjectFolder(projectName: string): string {
        return join(this.vaultFolder, projectName);
    }

    /**
     * This method calculates the meta-info.json path for the project inside the vault.
     * @param projectName is the name of the project.
     * @returns  A path to the meta-info.json inside the vault for the given project.
     */
    private getProjectMetaInfoFile(projectName: string): string {
        return join(this.getProjectFolder(projectName), "meta-info.json");
    }

    private getVersionString(packageVersion: VersionOrLinkType): string {
        if (packageVersion instanceof Version) {
            return packageVersion.toString();
        } else if (packageVersion instanceof Package) {
            return packageVersion.version.toString();
        } else {
            return packageVersion.path;
        }
    }

    /**
     * This method calculates the folder for the package inside the vault.
     * @param packageName (aka. projectName) is the name of the package/project.
     * @param packageVersion is the version of the package. Attention, this is 
     * not the version range, but the concrete version of the package.
     * @returns  A path to the project folder inside the vault.
     */
    private getPackageFolder(packageName: string, packageVersion: VersionOrLinkType): string {
        if (packageVersion instanceof Version) {
            return join(this.getProjectFolder(packageName), packageVersion.toString());
        } else if (packageVersion instanceof Package) {
            return join(this.getProjectFolder(packageVersion.name), packageVersion.version.toString());
        } else {
            return join(this.getProjectFolder(packageName), packageVersion.path);
        }
    }

    /**
     * This method calculates the package.json for the package inside the vault.
     * @param packageName (aka. projectName) is the name of the package/project.
     * @param packageVersion is the version of the package. Attention, this is 
     * not the version range, but the concrete version of the package.
     * @returns  A path to the package.json inside the vault.
     */
    private getPackageJsonFile(packageName: string, packageVersion: VersionOrLinkType): string {
        return join(this.getPackageFolder(packageName, packageVersion), "extracted/package.json");
    }

    /**
     * This method calculates the package.tgz for the package inside the vault.
     * @param packageName (aka. projectName) is the name of the package/project.
     * @param packageVersion is the version of the package. Attention, this is 
     * not the version range, but the concrete version of the package.
     * @returns  A path to the package.tgz inside the vault.
     */
    private getPackageTGZFile(packageName: string, packageVersion: VersionOrLinkType): string {
        return join(this.getPackageFolder(packageName, packageVersion), "package.tgz");
    }

    private async getPackageDownloadUrl(packageName: string, packageVersion: Version): Promise<string> {
        const projectMetaInfo = await this.updateProjectMetaInfo(packageName, false);
        let metaInfo;
        try {
            metaInfo = Utilities.readFileToJson(projectMetaInfo);
        } catch (e: any) {
            throw new Exception(`Meta information for '${packageName}@${packageVersion}' is invalid. (${e.message})`, e);
        }
        const version = metaInfo.versions[packageVersion.toString()];
        if (!version) {
            throw new Exception(`Version '${packageVersion} was not found in '${packageName}'.`);
        }
        return metaInfo.versions[packageVersion.toString()].dist.tarball;
    }

    private async downloadProjectMetaInfo(projectName: string): Promise<string> {
        this.logger.info(`Downloading meta-info for '${projectName}'...`);
        const projectFolder = this.getProjectFolder(projectName);
        Utilities.createFolder(projectFolder);
        const metaInfoFile = `${projectFolder}/meta-info.json`;
        await this.registry.downloadProjectMetaInfo(projectName, metaInfoFile);
        return metaInfoFile;
    }

    private hasProjectMetaInfo(projectName: string): boolean {
        const projectFolder = this.getProjectFolder(projectName);
        if (!fs.existsSync(projectFolder)) {
            return false;
        }
        const metaInfo = this.getProjectMetaInfoFile(projectName);
        if (!fs.existsSync(metaInfo)) {
            return false;
        }
        const outdated = this.isOutdated(metaInfo);
        if (outdated) {
            this.logger.info(`Meta-info for '${projectName}' outdated.`)
        }
        return !outdated;
    }

    private async updateProjectMetaInfo(projectName: string, forcedUpdate: boolean): Promise<string> {
        if (!this.hasProjectMetaInfo(projectName) || forcedUpdate) {
            return await this.downloadProjectMetaInfo(projectName);
        } else {
            return this.getProjectMetaInfoFile(projectName);
        }
    }

    /**
     * This method reads the corresponding ProjectMetaInfo. The project meta 
     * info is updated if needed upfront.
     * @param projectName 
     * @param forcedUpdate is used to enforce an update.
     * @returns 
     */
    public async readProjectMetaInfo(projectName: string, forcedUpdate: boolean): Promise<ProjectMetaInfo | undefined> {
        this.logger.debug(`readProjectMetaInfo(${projectName}, ${forcedUpdate})`)
        const metaInfoFile: string = await this.updateProjectMetaInfo(projectName, forcedUpdate);
        let metaInfo: any | undefined = undefined;
        try {
            metaInfo = Utilities.readFileToJson(metaInfoFile);
        } catch (e: any) {
            this.logger.warn(`Error reading meta-info.json for '${projectName}'! Forced update...`);
            await this.downloadProjectMetaInfo(projectName);
            this.logger.warn(`Updated.`);
            metaInfo = Utilities.readFileToJson(metaInfoFile);
        }
        if (metaInfo._id !== projectName) {
            this.logger.info(`Metainfo for ${projectName} is not valid`);
            return undefined;
        }
        return metaInfo;
    }

    private hasPackageTGZ(packageName: string, projectVersion: VersionOrLinkType): boolean {
        const packageTGZ = this.getPackageTGZFile(packageName, projectVersion);
        return fs.existsSync(packageTGZ);
    }

    private async updateSNAPSHOT(packageName: string, packageVersion: Version): Promise<void> {
        if (!packageVersion.isSnapshot()) {
            throw new Exception(`Package ${packageName}@${packageVersion.toString()} is not a SNAPSHOT.`);
        }
        if (!this.hasPackageTGZ(packageName, packageVersion)) {
            await this.downloadPackage(packageName, packageVersion);
        } else {
            const metaInfo = await this.readProjectMetaInfo(packageName, true);
            if (!metaInfo || !metaInfo.time) {
                console.warn(`Snapshot of package ${packageName}@${packageVersion.toString()} does not exist in the vault. Skipping update for this package...`);
                return;
            }
            const timeString = metaInfo.time[packageVersion.toString()];
            const time = Date.parse(timeString);
            const packageTGZ = this.getPackageTGZFile(packageName, packageVersion);
            if (time > fs.statSync(packageTGZ).mtime.getTime()) {
                await this.downloadPackage(packageName, packageVersion);
            }
        }
    }

    private async downloadPackage(packageName: string, projectVersion: VersionOrLinkType): Promise<void> {
        this.logger.info(`Downloading '${packageName}@${projectVersion.toString()}'...`);
        const dependencyFolder = this.getPackageFolder(packageName, projectVersion!);
        await Utilities.createFolder(dependencyFolder);
        const target = `${dependencyFolder}/extracted`;

        if (projectVersion instanceof Version) {
            const downloadURL = await this.getPackageDownloadUrl(packageName, projectVersion!);
            await this.logger.debug(`URL '${downloadURL}'`);
            const dependencyFile = `${dependencyFolder}/package.tgz`;
            await this.registry.download(downloadURL, dependencyFile);
            await Utilities.extractTGZ(dependencyFile, target);
        } else if ((projectVersion instanceof Package) && (projectVersion.version instanceof Version)) {
            const downloadURL = await this.getPackageDownloadUrl(projectVersion.name, projectVersion.version);
            await this.logger.debug(`URL '${downloadURL}'`);
            const dependencyFile = `${dependencyFolder}/package.tgz`;
            await this.registry.download(downloadURL, dependencyFile);
            await Utilities.extractTGZ(dependencyFile, target);
        } else if (projectVersion instanceof GitHubLink) {
            Utilities.createFolder(target);
            const gitCommand = `cd ${target} && git clone https://github.com/${projectVersion.path}.git`;
            await this.logger.debug(`GIT clone: '${gitCommand}'`);
            execSync(gitCommand);
        } else {
            await this.logger.error(`Unsupported version type '${projectVersion.toString()}' found.`);
            throw new Exception(`Downloading of packages of type '${packageName}@${projectVersion.toString()}' is not supported, yet.`);
        }
    }

    private hasPackageJson(packageName: string, projectVersion: VersionOrLinkType): boolean {
        const packageJson = this.getPackageJsonFile(packageName, projectVersion);
        return fs.existsSync(packageJson);
    }


    private async updatePackageJson(packageName: string, projectVersion: VersionOrLinkType): Promise<string> {
        this.logger.debug(`updatePackageJson(${packageName}, ${projectVersion.toString()})`);
        if (!this.hasPackageJson(packageName, projectVersion)) {
            await this.downloadPackage(packageName, projectVersion);
        }
        return this.getPackageJsonFile(packageName, projectVersion);
    }

    /**
     * This function reads the package json from the given target package.
     * @param targetPackage is the package to read the package.json from.
     * @returns A promise with PackageJson.
     */
    public async readPackageJson(targetPackage: Package): Promise<PackageJson> {
        this.logger.debug(`Reading package.json from ${targetPackage.toString()}`);
        let packageJson: string;
        if (targetPackage.version instanceof Version) {
            packageJson = await this.updatePackageJson(targetPackage.name, targetPackage.version);
        } else if (targetPackage.version instanceof Package) {
            packageJson = await this.updatePackageJson(targetPackage.version.name, targetPackage.version.version);
        } else {
            throw new Exception(`Target packages '${targetPackage.toString()}' are currently not supported.`);
        }
        return new PackageJson(packageJson);
    }

    /**
     * This function reads the PackageJsonContent from the most reasoned 
     * source. It is either the meta-info.json or the package.json if package
     * was shared.
     * @param targetPackage is the package to read the PackageJsonContent from.
     * @returns A promise with PackageJsonContent.
     */
    public async readPackageJsonFromLatestSource(targetPackage: Package, forcedUpdate: boolean): Promise<PackageJsonContent> {
        this.logger.debug(`readPackageJsonFromLatestSource(${targetPackage.toString()}, ${forcedUpdate})`)
        const actualPackage = targetPackage.version instanceof Package ? targetPackage.version : targetPackage;
        // package.json
        const packageTGZFile = this.getPackageTGZFile(actualPackage.name, targetPackage.version);
        let mtimePackageJson: Date = new Date(0);
        if (fs.existsSync(packageTGZFile)) {
            mtimePackageJson = fs.statSync(packageTGZFile).mtime;
        }
        // meta-info.json
        const metaInfo = await this.readProjectMetaInfo(actualPackage.name, forcedUpdate);
        let mtimeMetaInfo: Date = new Date(0);
        const time: string | undefined = metaInfo?.time[this.getVersionString(targetPackage.version)];
        if (time) {
            try {
                mtimeMetaInfo = new Date(time);
            } catch (e) {
                this.logger.warn(`Invalid timestampf or meta-info.json '${time}'.`)
            }
        }
        // make decision...
        this.logger.debug(`package.tgz: ${mtimePackageJson.toISOString()}, meta-info.json: ${mtimeMetaInfo.toISOString()}`);
        if (mtimeMetaInfo > mtimePackageJson) {
            return await this.readPackageJsonFromMetaInfo(targetPackage, forcedUpdate);
        } else {
            return (await this.readPackageJson(targetPackage)).definitions;
        }
    }

    /**
     * This function reads the package json content from the package's meta-info.json. 
     * @param targetPackage is the package to read the meta-info from.
     * @returns A promise with PackageJsonContent.
     */
    private async readPackageJsonFromMetaInfo(targetPackage: Package, forcedUpdate: boolean): Promise<PackageJsonContent> {
        this.logger.debug(`Reading package info from meta-info.json from ${targetPackage.toString()} (forcedUpdate: ${forcedUpdate})`);
        try {
            let targetPackageName: string;
            let targetPackageVersion: string;
            if (targetPackage.version instanceof Version) {
                targetPackageName = targetPackage.name;
                targetPackageVersion = targetPackage.version.toString();
            } else if (targetPackage.version instanceof Package) {
                targetPackageName = targetPackage.version.name;
                targetPackageVersion = targetPackage.version.version.toString();
            } else {
                throw new Exception(`Target packages '${targetPackage.toString()}' are currently not supported.`);
            }
            const projectMetaInfo = await this.readProjectMetaInfo(targetPackageName, forcedUpdate);
            if (!projectMetaInfo) {
                throw new Exception(`No meta-info.json found for package '${targetPackage.toString()}'.`);
            }
            let versionInformaion: VersionInformation = projectMetaInfo.versions[targetPackageVersion];
            return {
                name: versionInformaion.name,
                version: versionInformaion.version,
                bin: versionInformaion.bin,
                scripts: versionInformaion.scripts,
                dependencies: PackageJson.convertDependencies(versionInformaion.dependencies, DependencyType.PROD),
                devDependencies: PackageJson.convertDependencies(versionInformaion.devDependencies, DependencyType.DEV),
                peerDependencies: PackageJson.convertDependencies(versionInformaion.peerDependencies, DependencyType.PEER),
                optionalDependencies: PackageJson.convertDependencies(versionInformaion.optionalDependencies, DependencyType.OPTIONAL)
            };
        } catch (e) {
            if (!targetPackage.isSnapshot()) {
                // A missing non-SNAPSHOT package is an error.
                throw e;
            }
            // For SNAPSHOTs we try to fallback to a locally shared library...
            return (await this.readPackageJson(targetPackage)).definitions;
        }
    }

    /**
     * Reads the latest version from registry's meta-info.json.
     * @param packageName 
     * @param versionRange 
     * @returns 
     */
    private async readLatestVersionFromProjectMetaInfo(packageName: string, versionRange: VersionRange, forcedUpdate: boolean): Promise<Version | undefined> {
        this.logger.debug(`readLatestVersionFromProjectMetaInfo(${packageName}@${versionRange.toString()})`);
        const metaInfo: ProjectMetaInfo | undefined = await this.readProjectMetaInfo(packageName, forcedUpdate);
        let maxVersion: Version | undefined = undefined;
        if (metaInfo) {
            for (let versionString in metaInfo.versions) {
                const version = Version.of(versionString);
                if ((versionRange.contains(version))
                    && (version.compare(maxVersion) > 0)) {
                    if (version.isPreRelease()) {
                        if (versionRange.containsPreRelease()) {
                            maxVersion = version;
                        }
                    } else {
                        maxVersion = version;
                    }
                }
            }
        }
        this.logger.debug(`readLatestVersionFromProjectMetaInfo=${maxVersion}`);
        return maxVersion;
    }

    /**
     * Reads the latest version from local vault.
     * @param packageName 
     * @param versionRange 
     * @returns 
     */
    private async readLatestVersionFromLocalVault(packageName: string, versionRange: VersionRange): Promise<Version | undefined> {
        this.logger.debug(`readLatestVersionFromLocalVault(${packageName}@${versionRange.toString()})`);
        const packageFolder = await this.getProjectFolder(packageName);
        const versions: Dirent[] = fs.readdirSync(packageFolder, { recursive: false, withFileTypes: true });
        let maxVersion: Version | undefined = undefined;
        for (let versionDirent of versions) {
            if (!versionDirent.isDirectory()) {
                continue;
            }
            const versionString = versionDirent.name;
            const version = Version.of(versionString);
            if ((versionRange.contains(version))
                && (version.compare(maxVersion) > 0)) {
                if (version.isPreRelease()) {
                    if (versionRange.containsPreRelease()) {
                        maxVersion = version;
                    }
                } else {
                    maxVersion = version;
                }
            }
        }
        this.logger.debug(`readLatestVersionFromLocalVault=${maxVersion}`);
        return maxVersion;
    }

    private async readLatestVersion(packageName: string, versionRange: VersionRange, forcedUpdate: boolean): Promise<Version | undefined> {
        this.logger.debug(`readLatestVersion(${packageName}@${versionRange.toString()})`);
        const registryVersion: Version | undefined = await this.readLatestVersionFromProjectMetaInfo(packageName, versionRange, forcedUpdate);
        const localVersion: Version | undefined = await this.readLatestVersionFromLocalVault(packageName, versionRange);
        if (!localVersion) {
            this.logger.debug(`readLatestVersion=${registryVersion}`);
            return registryVersion;
        }
        if (localVersion.compare(registryVersion!) > 0) {
            this.logger.debug(`readLatestVersion=${localVersion}`);
            return localVersion;
        } else {
            this.logger.debug(`readLatestVersion=${registryVersion}`);
            return registryVersion;
        }
    }

    /**
     * This is one of the most important methods to get the NoVa 
     * implementation correct: It searches for the latest version of a package
     * what satisfies the version range defined.
     * 
     * For SNAPSHOT versions, these are specific versions and we return them as 
     * is.
     * 
     * @param dependency 
     * @returns 
     */
    public async getLatestMatchingVersion(dependency: Dependency, forcedUpdate: boolean): Promise<Package | undefined> {
        this.logger.debug(`getLatestMatchingVersion(${dependency.toString()})`);
        const versionRange = dependency.versionRange;
        if (versionRange instanceof GitHubLink) {
            return new Package(dependency.name, versionRange);
        } else if (versionRange instanceof GitLink) {
            return new Package(dependency.name, versionRange);
        } else if (versionRange instanceof FileLink) {
            return new Package(dependency.name, versionRange);
        } else if (versionRange instanceof NpmLink) {
            if (versionRange.versionRange.containsSnapshot()) {
                throw new Exception(`NPM links like '${versionRange.toString()}'are not supported with SNAPSHOTs.`);
            }
            const version = await this.readLatestVersion(versionRange.packageName, versionRange.versionRange, forcedUpdate);
            if (!version) {
                return undefined;
            }
            return new Package(dependency.name, new Package(versionRange.packageName, version));
        } else {
            if (versionRange.containsSnapshot()) {
                try {
                    const snapshotVersion = Version.of(versionRange.version);
                    return new Package(dependency.name, snapshotVersion);
                } catch (e: any) {
                    console.error(`Version '${versionRange.version}' is not a valid SNAPSHOT version. SNAPSHOTs need to be exact versions: ${e.message}`);
                    throw new Exception(`SNAPSHOT dependency version for '${dependency.name}@${dependency.versionRange}' is invalid: ${e.message}`, e);
                }
            } else {
                const version = await this.readLatestVersion(dependency.name, versionRange, forcedUpdate);
                if (!version) {
                    return undefined;
                }
                return new Package(dependency.name, version);
            }
        }
    }

    /**
     * This method is used to start the lifecycle scripts which may be 
     * manadatory to run in order to use the dependencies.
     * 
     * See: https://docs.npmjs.com/cli/v9/using-npm/scripts
     *  
     * @param packageJson 
     * @param folder 
     * @param lifecycle 
     */
    public async runLifecycleScript(packageJson: PackageJsonContent, folder: string, lifecycle: Lifecycle): Promise<void> {
        if (!packageJson.scripts) {
            return;
        }
        const command = packageJson.scripts[lifecycle];
        if (!command) {
            return;
        }
        try {
            this.logger.info(`Running ${lifecycle} lifecycle script '${command}' inside '${folder}'...`)
            const result = await new Promise<string>((approve, reject) => {
                exec(command, { cwd: folder }, (error, stdout, stderr) => {
                    if (error) {
                        this.logger.error(`Error occured: ${error}`);
                        this.logger.info(`stdout: '${stdout}'`);
                        this.logger.error(`stderr:' ${stderr}'`);
                        reject(`Error occured: ${error}`);
                    } else {
                        this.logger.warn(`stderr: '${stderr}'`);
                        approve(stdout);
                    }
                });
            });
            this.logger.info(`Script result: ${result.toString()}`)
        } catch (e: any) {
            this.logger.warn(`Could not run ${lifecycle} lifecycle script for ${packageJson.name}@${packageJson.version}.`);
        }
    }

    /**
     * This method performs an actual implementation.
     * @param packageJson content of the containing package.json. 
     * @param folder is pointing to the node_modules folder where this package
     * has to go to. This may be a subdirectory of the root node_modules folder.
     * @param targetFolder is the root node_modules folder used for .bin links.
     *  
     */
    public async install(packageJson: PackageJsonContent, folder: string, targetFolder: string, alternateName?: string): Promise<void> {
        const packageName = alternateName ? alternateName : packageJson.name;
        const packageVersion = Version.of(packageJson.version);
        this.logger.info(`Installing '${packageJson.name}@${packageVersion}'...`)
        // In case of SNAPSHOTs, we need to update first in order to always provide the latest version.
        if (packageVersion.isSnapshot()) {
            await this.updateSNAPSHOT(packageName, packageVersion);
        } else {
            // Assure file being in in vault
            if (!this.hasPackageJson(packageJson.name, packageVersion)) {
                await this.updatePackageJson(packageJson.name, packageVersion)
            }
        }
        const tgzFile = this.getPackageTGZFile(packageJson.name, packageVersion);
        // Extract it in target folder
        const packageFolder = join(folder, packageName);
        await Utilities.extractTGZ(tgzFile, packageFolder);
        // Create symbolic links for executables
        const binFolder = join(targetFolder, ".bin");
        Utilities.createFolder(binFolder);
        if (packageJson.bin) {
            if (typeof packageJson.bin === 'object') {
                for (let name in packageJson.bin) {
                    fs.chmodSync(join(packageFolder, packageJson.bin[name]), 0o755);
                    Utilities.createLink(normalize(join("..", packageName, packageJson.bin[name])), join(binFolder, name));
                }
            } else if (typeof packageJson.bin === 'string') {
                const name = packageJson.bin.split('/').pop()!;
                fs.chmodSync(join(packageFolder, packageJson.bin), 0o755);
                Utilities.createLink(normalize(join("..", packageName, packageJson.bin)), join(binFolder, name));
            }
        }
    }

    public async share(packageJson: PackageJsonContent, tgzFile: string) {
        const packageFolder = this.getPackageFolder(packageJson.name, Version.of(packageJson.version));
        Utilities.createFolder(packageFolder);
        const targetTGZ = join(packageFolder, "package.tgz");
        fs.copyFileSync(tgzFile, targetTGZ);
        await Utilities.extractTGZ(targetTGZ, join(packageFolder, "extracted"));
    }
}
