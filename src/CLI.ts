import { CommandLineParser } from '@rushstack/ts-command-line';
import {VersionAction} from './version/VersionAction.js'
export class CLI extends CommandLineParser {

    private readonly inputFile = "package.json";
    private readonly targetFolder = "node_modules";

    constructor() {
        super({
            toolFilename: 'nova',
            toolDescription: 'An enhanced NodeJS package manager for SNAPSHOTs and development.'
        });
        this.addAction(new VersionAction());
    }

    protected onDefineParameters(): void {
        this.defineFlagParameter({
            parameterLongName: "--debug",
            description: "Switches NodeVault into debugging log level.",
            required: false
        });
    }

    protected async onExecute(): Promise<void> {
        console.log(`Using '${this.inputFile}' to install into '${this.targetFolder}'...`)
        await super.onExecute();
        console.log("done.")
    }

}
