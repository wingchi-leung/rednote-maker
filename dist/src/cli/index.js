#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = require("../../package.json");
const templates_1 = require("./commands/templates");
const generate_1 = require("./commands/generate");
const program = new commander_1.Command();
program
    .name("rednotemaker")
    .description("RedNoteMaker CLI - 将 Markdown 转换为小红书图文卡片")
    .version(package_json_1.version);
program.addCommand((0, templates_1.templatesCommand)());
program.addCommand((0, generate_1.generateCommand)());
program.parseAsync(process.argv).catch((error) => {
    console.error("执行错误:", error.message);
    process.exit(1);
});
