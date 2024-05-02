import { CommandLineParser } from '@rushstack/ts-command-line';
import log4js from 'log4js';
import { NoVa } from './NoVa.js';
import { NoVaLogger } from './NoVaLogger.js';
import { InstallAction } from './install/InstallAction.js';
import { NPMjs } from './registries/NPMjs.js';
import { ScanAction } from './scan/ScanAction.js';
import { ShareAction } from './share/ShareAction.js';
import { UpdateAction } from './update/UpdateAction.js';
import { Vault } from './vault/Vault.js';
import { VersionAction } from './version/VersionAction.js';

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
        this.addAction(new ScanAction(this.inputFile));
        this.addAction(new InstallAction(this.inputFile, this.targetFolder));
        this.addAction(new UpdateAction(this.inputFile, this.targetFolder));
        this.addAction(new ShareAction(this.inputFile));
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
            Vault.init(new NPMjs(), NoVa.novaFolder);
            try {
                console.log(`Using '${this.inputFile}' to install into '${this.targetFolder}'...`)
                await super.onExecute();
                await this.logFinish(start);
            } finally {
                Vault.shutdown();
            }
        } finally {
            NoVaLogger.shutdown();
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
