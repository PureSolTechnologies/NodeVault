import os from 'os';
import path from "path";

/**
 * This class contains the central settings and configuration for all parts
 * of the tool.
 */
export class NoVa {

    /**
     * User's home directory.
     */
    public static readonly homeFolder: string = os.homedir();
    /**
     * NodeVault's folder for the vault and configuration.
     */
    public static readonly novaFolder: string = path.join(NoVa.homeFolder, ".nova");
    /**
     * NodeVault's global settings file.
     */
    public static readonly settingsFile: string = path.join(NoVa.novaFolder, "settings.json");

}
