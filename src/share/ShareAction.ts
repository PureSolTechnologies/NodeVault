import { CommandLineAction } from "@rushstack/ts-command-line";
import fs from 'fs';
import log4js from 'log4js';
import { PackageJson } from "../PackageJson.js";
import { Vault } from "../vault/index.js";

export class ShareAction extends CommandLineAction {

    private readonly logger = log4js.getLogger();

    constructor(
        private readonly inputFile: string
    ) {
        super({
            actionName: "share",
            summary: "Puts a SNAPSHOT in to the local repository.",
            documentation: "If the project is in a SNAPSHOT state (version has prerelease suffix -SNAPSHOT), it provides a copy in the local SPAM repository."
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
        this.logger.info(`SHARE started for '${packageJson.definitions.name}@${packageJson.definitions.version}'...`)
        console.log(`Sharing ${packageJson.definitions.name}@${packageJson.definitions.version} via local SPAM repository...`)
        const tgzFile = packageJson.definitions.name.replace("@", "").replace("/", "-") + "-" + packageJson.definitions.version + ".tgz";
        if (!fs.existsSync(tgzFile)) {
            // Nothing to do here...
            throw Error(`No TGZ package file '${tgzFile}' found.`);
        }

        const vault = Vault.get();
        vault.share(packageJson.definitions, tgzFile);
        console.log(`Shared.`)
        this.logger.info("SHARE done.")
    }

}