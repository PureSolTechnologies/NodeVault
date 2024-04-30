import path from "path";
import { Nexus, NoVaLogger, Utilities, Vault } from "../../src/index.js";

export class IntegrationTest {

    readonly baseFolder: string;
    /**
     * Target node_modules folder for integration test.
     */
    readonly targetFolder: string;
    /**
     * Target node_modules folder for integration test.
     */
    readonly vaultFolder: string;

    public vault: Vault | undefined = undefined;

    constructor(readonly testName: string) {
        this.baseFolder = path.join("_integration_tests_", testName);
        this.targetFolder = path.join(this.baseFolder, "node_modules");
        this.vaultFolder = path.join(this.baseFolder, "vault");
    }

    public init() {
        NoVaLogger.init(this.baseFolder);
        Utilities.createFolder(this.baseFolder);
        Utilities.createFolder(this.vaultFolder);
        Utilities.createFolder(this.targetFolder);
        this.vault = Vault.init(new Nexus(), this.baseFolder);
    }

    public close() {
        NoVaLogger.shutdown();
    }

}