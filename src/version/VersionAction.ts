import { CommandLineAction } from "@rushstack/ts-command-line";
import { NOVA_TIMESTAMP, NOVA_VERSION} from "./version.js";

/**
 * SPAM version action
 */
export class VersionAction extends CommandLineAction {

    public readonly version: string =NOVA_VERSION;
    public readonly timestamp: string = NOVA_TIMESTAMP;

    constructor() {
        super({
            actionName: "version",
            summary: "NodeVault's version",
            documentation: `Provides information about NodeVault's version and additional build information.`
        })
    }

    protected async onExecute(): Promise<void> {
        console.log(`NodeVault Version: ${this.version}`);
        console.log(`Build time:   ${this.timestamp}`);
    }
}