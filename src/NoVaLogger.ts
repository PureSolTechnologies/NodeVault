import log4js, { Configuration, Level } from 'log4js';
import { Exception } from "./Exception.js";

/**
 * This is a convenience class to bundle the logger configuration and 
 * implementation into a single spot.
 */
export class NoVaLogger {

    private static instance: NoVaLogger | undefined = undefined;

    public static init(logFolder: string, logLevel: Level = log4js.levels.INFO, comparableLogs: boolean = false): NoVaLogger {
        if (NoVaLogger.instance) {
            throw new Exception("NoVa logger was already initialized!");
        }
        NoVaLogger.instance = new NoVaLogger(logFolder, logLevel, comparableLogs);
        NoVaLogger.instance.init();
        return NoVaLogger.instance;
    }

    public static shutdown(): void {
        if (!NoVaLogger.instance) {
            throw new Exception("NoVa logger was not yet initialized.");
        }
        NoVaLogger.instance.shutdown();
        NoVaLogger.instance = undefined;
    }

    public static get(): NoVaLogger {
        if (!NoVaLogger.instance) {
            throw new Exception("NoVa logger was not yet initialized.");
        }
        return NoVaLogger.instance;
    }

    readonly configuration: Configuration;

    private constructor(readonly logFolder: string, readonly logLevel: Level, readonly comparableLogs: boolean) {
        const time = new Date().toISOString();
        if (comparableLogs) {
            this.configuration = {
                appenders: {
                    node_modules: {
                        type: "file",
                        filename: `${this.logFolder}/nova-${time}.log`,
                        layout: {
                            type: 'pattern',
                            pattern: "[] [%p] %c - %m"
                        }
                    }
                },
                categories: { default: { appenders: ["node_modules"], level: this.logLevel.levelStr } },
            };
        } else {
            this.configuration = {
                appenders: {
                    node_modules: {
                        type: "file",
                        filename: `${this.logFolder}/nova-${time}.log`
                    }
                },
                categories: { default: { appenders: ["node_modules"], level: this.logLevel.levelStr } },
            };
        }
    }

    private init(): Configuration {
        log4js.configure(this.configuration);
        return this.configuration;
    }

    private shutdown(): void {
        log4js.shutdown();
    }

}
