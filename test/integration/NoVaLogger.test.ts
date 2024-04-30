import { describe, expect, it, test } from "@jest/globals";
import fs from 'fs';
import log4js, { Logger } from "log4js";
import { NoVaLogger } from "../../src/index.js";

describe("NoVaLogger tests", () => {

    let novaLogger: NoVaLogger;
    let logger: Logger;

    beforeAll(() => {
        novaLogger = NoVaLogger.init("_nova_logger_tests_");
        expect(novaLogger).toBeDefined();
        expect(log4js.isConfigured()).toBeTruthy();
        logger = log4js.getLogger();
        expect(logger).toBeDefined();
    });

    afterAll(() => {
        NoVaLogger.shutdown();
    });

    test("configuration", () => {
        const appenders = novaLogger.configuration.appenders;
        expect(appenders).toBeDefined();
        const nodeModulesAppender = appenders.node_modules;
        expect(nodeModulesAppender).toBeDefined();
        expect(nodeModulesAppender.type).toBe("file");
        expect((nodeModulesAppender as any)["filename"]).toBeDefined();
    });


    it("INFO level", async () => {
        const appenders = novaLogger.configuration.appenders;
        const nodeModulesAppender = appenders.node_modules;
        const fileName = (nodeModulesAppender as any)["filename"];

        for (let i = 0; i < 100; i++) {
            logger.info("INFO level message");
        }
        expect(fs.existsSync(fileName)).toBeTruthy();
    });
});