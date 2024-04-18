#!/usr/bin/env node
import { CLI } from '../dist/CLI.js';

const commandLine = new CLI();
await commandLine.execute();
