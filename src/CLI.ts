import { CommandLineParser } from '@rushstack/ts-command-line';
import { VersionAction } from './version/VersionAction.js'
import log4js from 'log4js';
import { NoVaLogger } from './NoVaLogger.js';

export class CLI extends CommandLineParser {

    private readonly inputFile = "package.json";
    private readonly targetFolder = "node_modules";
    private readonly logger = log4js.getLogger();

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
        const start = Date.now();
        await this.initLogger();
        this.logger.info("NodeVault started...");
        try {
            console.log(`Using '${this.inputFile}' to install into '${this.targetFolder}'...`)
            await super.onExecute();
            await this.logFinish(start);
        } finally {
            await NoVaLogger.shutdown();
        }
    }

    private async initLogger(): Promise<void> {
        const debug = this.getFlagParameter("--debug");
        let logLevel = log4js.levels.INFO;
        if (debug.value) {
            logLevel = log4js.levels.DEBUG;
        }
        await NoVaLogger.init(this.targetFolder, logLevel);
    }

    private async logFinish(start: number) {
        const end = Date.now();
        const duration = end - start;
        this.logger.info(`Finished in ${duration} ms.`);
        console.log(`Finished in ${duration} ms.`);
    }
}
