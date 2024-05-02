import { CommandLineAction } from "@rushstack/ts-command-line";
import fs from 'fs';
import log4js from 'log4js';
import { PackageJson } from "../index.js";
import { Updater } from "./Updater.js";

export class UpdateAction extends CommandLineAction {

    private readonly logger = log4js.getLogger();

    constructor(
        private readonly inputFile: string,
        readonly targetFolder: string
    ) {
        super({
            actionName: "update",
            summary: "Updates all SNAPSHOTs to the latest version from repo and registry.",
            documentation: `Updates all packages to the latest package of them-selves.
As normal releases are fixed, this is only applicable for
SNAPSHOTs.`
        })
    }

    protected onDefineParameters(): void {
        // for additional flags and input parameters
    }

    protected async onExecute(): Promise<void> {
        // Check presence of package.json
        if (!fs.existsSync(this.inputFile)) {
            // Nothing to do here...
            throw Error(`No ${this.inputFile} found.`);
        }
        const packageJson = new PackageJson(this.inputFile);
        this.logger.info(`UPDATE started for '${packageJson.definitions.name}@${packageJson.definitions.version}'...`)
        await new Updater(this.inputFile, this.targetFolder).update();
        this.logger.info("UPDATE done.")
    }
}