import { execSync } from "child_process";
import fs, { PathLike, WriteStream } from "fs";
import log4js from "log4js";
import path from 'path';
import { x } from "tar";
import { Exception } from "./Exception.js";

/**
 * Collection of utility functions to ease development.
 */
export class Utilities {

    private static readonly logger = log4js.getLogger();

    /**
     * Idempotent creation of a new folder incl. potential parents. If it does exists, nothing happens.
     * @param folder the path for the new folder.
     */
    static async createFolder(folder: PathLike) {
        if (!fs.existsSync(folder)) {
            Utilities.logger.debug(`Creating folder '${folder}...`);
            fs.mkdirSync(folder, { recursive: true });
        }
    }

    /**
     * Simple method to read files from filesystem to JSON.
     * @param file is the path to the file to be read.
     * @returns A JSON is returned.
     */
    static readFileToJson(file: PathLike): any {
        try {
            return JSON.parse(fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }));
        } catch (e: any) {
            throw new Exception(`File '${file} could not be read to JSON: '${e.message}'`, e);
        }
    }

    /**
     * Extract a given TGZ file into the given target folder with skipping the first folder.
     * @param tgzFile 
     * @param targetFolder 
     * @returns 
     */
    static async extractTGZ(tgzFile: string, targetFolder: string): Promise<string> {
        try {
            this.createFolder(targetFolder);

            Utilities.logger.info(`Extracting TGZ '${tgzFile}' to '${targetFolder}'...`);

            await x({
                file: tgzFile,
                strip: 1,
                C: targetFolder
            });

            return targetFolder;
        } catch (e: any) {
            const message = `Could not extract '${tgzFile}' to ${targetFolder}: ${e.message}`;
            Utilities.logger.error(message);
            return targetFolder;
            // Disabled: Some packges are broken (pngjs!)
            // throw new Exception(message, e);
        }
    }

    static createLink(link: string, target: string): void {
        try {
            Utilities.logger.warn(`Link '${target}' exists. Deleting it...`)
            if (fs.existsSync(target)) {
                fs.unlinkSync(target);
                Utilities.logger.warn(`Link '${target}' deleted.`)
            }
            const lnCommand = `ln -s "${link}" "${target}"`;
            Utilities.logger.info(`Creating Link '${target}' to '${link}'...`)
            execSync(lnCommand);
            Utilities.logger.info("Created.")
        } catch (e: any) {
            const message = `Could not create link '${link}' to ${target}: ${e.message}`;
            Utilities.logger.error(message);
            //throw new Exception(message, e);
        }
    }

    static async createLogFile(file: string): Promise<WriteStream> {
        return new Promise<WriteStream>((resolve, reject) => {
            const dirname = path.dirname(file);
            if (dirname) {
                Utilities.createFolder(dirname);
            }
            const logFile = path.resolve(file);
            if (fs.existsSync(logFile)) {
                fs.unlinkSync(logFile);
            }
            const stream = fs.createWriteStream(
                logFile,
                {
                    encoding: 'utf8',
                    flags: 'w',
                    flush: true,
                    autoClose: true
                }
            );
            stream.on('open', () => resolve(stream));
            stream.on('error', () => reject());
        });
    }

    static async closeLogFile(stream: WriteStream): Promise<void> {
        if (!stream) {
            return;
        }
        return new Promise<void>(async (approve, reject) => {
            try {
                stream.on("finish", () => {
                    stream.close();
                    approve();
                });
                stream.on("error", () => {
                    stream.close();
                    reject();
                });
                stream.end();
            } catch (err) {
                console.error(`Could not close the log file. ERROR: ${err}`);
                reject(err);
            }
        });
    }

    static indent(level: number): string {
        let indentation = "";
        for (let i = 0; i < level; i++) {
            indentation += "    ";
        }
        return indentation;
    }

}