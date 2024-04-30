import { CommandLineAction } from "@rushstack/ts-command-line";
import { NodeModulesScanner } from "./NodeModulesScanner.js";

/**
 * This action is used to scan a current node_modules directory. This can be
 * useful to investigate the final result of a NoVa install or with the result
 * of another package manager.
 */
export class ScanAction extends CommandLineAction {

    constructor(
        private readonly inputFile: string
    ) {
        super({
            actionName: "scan",
            summary: "Scans the node_modules directory.",
            documentation:
                `This command reads the node_modules into a file in a normalized form like 
alpha-numerical ordering it is used to compare different trees created by
different tools like npm and nova to check for differences.`
        })
    }

    protected onDefineParameters(): void {
        // for additional flags and input parameters
    }

    protected async onExecute(): Promise<void> {
        await new NodeModulesScanner(this.inputFile).scanAndExport();
    }


}