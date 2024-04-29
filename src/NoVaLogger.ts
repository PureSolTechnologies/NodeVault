import log4js from 'log4js';
import { Exception } from "./Exception.js";

/**
 * This is a convenience class to bundle the logger configuration and 
 * implementation into a single spot.
 */
export class NoVaLogger {

    private static instance: NoVaLogger | undefined = undefined;

    public static async init(logFolder: string, logLevel: log4js.Level): Promise<NoVaLogger> {
        if (NoVaLogger.instance) {
            throw new Exception("NoVa logger was already initialized!");
        }
        NoVaLogger.instance = new NoVaLogger(logFolder, logLevel);
        await NoVaLogger.instance.init();
        return NoVaLogger.instance;
    }

    public static async shutdown(): Promise<void> {
        if (!NoVaLogger.instance) {
            throw new Exception("NoVa logger was not yet initialized.");
        }
        await NoVaLogger.instance.shutdown();
        NoVaLogger.instance = undefined;
    }

    public static get(): NoVaLogger {
        if (!NoVaLogger.instance) {
            throw new Exception("NoVa logger was not yet initialized.");
        }
        return NoVaLogger.instance;
    }

    private constructor(readonly logFolder: string, readonly logLevel: log4js.Level) {
    }

    private async init(): Promise<void> {
        const time = new Date().toISOString();
        log4js.configure({
            appenders: { node_modules: { type: "file", filename: `${this.logFolder}/nova-${time}.log` } },
            categories: { default: { appenders: ["node_modules"], level: this.logLevel.levelStr } },
        });
    }

    private async shutdown(): Promise<void> {
        log4js.shutdown();
    }

}
