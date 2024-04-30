import log4js from 'log4js';
import { join } from 'path';
import { DependencyNode, DependencyTreeCreator, DependencyTreeOptimizer, Lifecycle, Package, PackageJson, PackageJsonContent, Utilities, Vault } from '../index.js';

/**
 * This class is used to install the given dependencies into a node_modules folder.
 */
export class Installer {

    static readonly currentFolder: string = process.cwd();


    /**
     * This field contains whether only packages' package.json files are used
     * for dependency information or not. Per default (false), meta-info.json
     * files are used for performance reasons.
     */
    private usePackageJson: boolean = false;
    /**
     * This field contains the flag for enforced vault updates.
     */
    private enforcedUpdate: boolean = false;
    private readonly vault = Vault.get();
    private readonly targetFolder: string;
    private readonly packageJson: PackageJsonContent;
    private readonly logger = log4js.getLogger();

    constructor(
        packageJson: string | PackageJsonContent,
        targetFolder?: string
    ) {
        if (targetFolder) {
            this.targetFolder = targetFolder;
        } else {
            this.targetFolder = `${Installer.currentFolder}/node_modules`;
        }
        Utilities.createFolder(this.targetFolder);
        if (typeof packageJson === 'string') {
            this.packageJson = new PackageJson(packageJson).definitions;
        } else {
            this.packageJson = packageJson;
        }
    }

    public setUsePackageJson(usePackageJson: boolean): void {
        this.usePackageJson = usePackageJson;
    }

    public setEnforcedUpdated(enforcedUpdate: boolean): void {
        this.enforcedUpdate = enforcedUpdate;
    }


    /**
     * Installs a single dependency.
     * @param folder is the target folder for the package to be installed into.
     * @param node the dependency node to be installed.
     */
    private async installDependency(folder: string, node: DependencyNode): Promise<void> {
        await this.vault.install(node.packageJson, folder, this.targetFolder, node.targetPackage.version instanceof Package ? node.targetPackage.name : undefined);
        await this.installDependencies(`${folder}/${node.packageJson.name}/node_modules`, node.children);
    }

    private async installDependencies(folder: string, nodes: DependencyNode[]): Promise<void> {
        await Promise.all(nodes.map(node => this.installDependency(folder, node)));
    }

    /**
     * This method runs the lifecycle scripts of packages. These scripts are documented here:
     * https://docs.npmjs.com/cli/v9/using-npm/scripts
     * 
     * The order was taken from NPM's implementation: 
     * https://github.com/npm/cli/blob/latest/lib/commands/install.js
     * 
     * @param folder working folder (package folder inside node_modules).
     * @param node is the dependency node in the dependency tree.
     */
    private async runDependencyLifeCycleScripts(folder: string, node: DependencyNode): Promise<void> {
        // Run postinstall scripts
        await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.PREINSTALL);
        await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.INSTALL);
        await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.POSTINSTLL);
        // await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.PREPUBLISH); // theoretically obsolete
        // await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.PREPREPARE);
        // await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.PREPARE);
        // await this.vault.runLifecycleScript(node.packageJson, join(folder, node.packageJson.name), Lifecycle.POSTPREPARE);
        // Run scripts for children...
        await this.runLifecycleScripts(join(folder, node.packageJson.name, "node_modules"), node.children);
    }

    private async runLifecycleScripts(folder: string, nodes: DependencyNode[]): Promise<void> {
        await Promise.all(nodes.map(node => this.runDependencyLifeCycleScripts(folder, node)));
    }

    /**
     * This method installs the needed dependencies for the given package.json
     * file into node_modules.
     * 
     * This method is used the project.json, but also for all dependency 
     * package.json files.
     * 
     * Important: We need to first install all dependencies and then we run 
     * all the scripts. Otherwise, dependencies may be missing.
     * 
     * @param packageJson The path to the package.json.
     */
    private async installDependencyTree(root: DependencyNode): Promise<void> {
        await this.installDependencies(this.targetFolder, root.children);
        await this.runLifecycleScripts(this.targetFolder, root.children);
    }

    /**
     * Triggers the actual installation process. It is the high level 
     * implementation which triggers all sub-steps.
    */
    public async install(): Promise<void> {
        const start = Date.now();
        this.logger.info(`INSTALL started for '${this.packageJson.name}@${this.packageJson.version}@'...`)

        console.log('Creating dependency tree...')
        this.logger.info('Creating dependency tree...')
        const dependencyTree = new DependencyTreeCreator(this.vault, this.targetFolder, this.usePackageJson, this.enforcedUpdate);
        const tree = await dependencyTree.createTree(this.packageJson);

        this.logger.info('Optimizing dependency tree...')
        console.log('Optimizing dependency tree...')
        const optimizer = new DependencyTreeOptimizer(this.targetFolder);
        await optimizer.optimize(tree);

        this.logger.info(`Installing packages to ${this.targetFolder}...`)
        console.log('Installing dependencies...')
        await this.installDependencyTree(tree);

        const end = Date.now();
        this.logger.info(`Installation took ${end - start}ms.`)
        this.logger.info("INSTALL done.")
    }

}
