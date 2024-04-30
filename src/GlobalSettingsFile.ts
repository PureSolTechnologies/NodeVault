import fs from "fs";
import { NoVa } from "./NoVa.js";
import { Settings } from "./Settings.js";

export class GlobalSettingsFile {

    public static read(): Settings {

        fs.readFileSync(NoVa.settingsFile,)
        return {};
    }

}