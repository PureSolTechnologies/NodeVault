import { CommandLineAction } from "@rushstack/ts-command-line";
import fs from 'fs';
import { Installer } from "./Installer.js";

export class InstallAction extends CommandLineAction {

    constructor(
        readonly inputFile: string,
        readonly targetFolder: string
    ) {
        super({
            actionName: "install",
            summary: "Created node_modules folder based package.json.",
            documentation: "Installs dependencies into node_modules folder."
        })
    }

    protected onDefineParameters(): void {
        this.defineFlagParameter({
            parameterLongName: "--use-package-json",
            description: "Uses dependency information solely from packages' package.json files.",
            required: false
        });
        this.defineFlagParameter({
            parameterLongName: "--update",
            parameterShortName: "-U",
            description: "Enforces the local vault to update itself against the registry. This overrides the default update period.",
            required: false
        });
    }

    protected async onExecute(): Promise<void> {
        // Check presence of package.json
        if (!fs.existsSync(this.inputFile)) {
            // Nothing to do here...
            throw Error(`No ${this.inputFile} found.`);
        }
        console.log(`Installing dependencies for '${this.inputFile}' to ${this.targetFolder}...`);
        const installer = new Installer(this.inputFile, this.targetFolder);
        installer.setUsePackageJson(this.getFlagParameter("--use-package-json").value);
        installer.setEnforcedUpdated(this.getFlagParameter("--update").value);
        await installer.install();

        console.log("Installation done.")
    }

}