import {readFileSync, writeFileSync} from 'fs';
import {resolve, dirname}from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonPath = resolve(__dirname, '../package.json');
const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
const packageJson = JSON.parse(packageJsonContent);

const versionFilePath = resolve(__dirname, 'src', '../version.ts');

const versionFileContent = `
    // This file is auto-generated during the build process.
    export const NOVA_VERSION = '${packageJson.version}';
    export const NOVA_TIMESTAMP = '${new Date().toISOString()}';
    `;

writeFileSync(versionFilePath, versionFileContent);
