#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../../package.json";
import { templatesCommand } from "./commands/templates";
import { generateCommand } from "./commands/generate";

const program = new Command();

program
  .name("rednotemaker")
  .description("RedNoteMaker CLI - 将 Markdown 转换为小红书图文卡片")
  .version(version);

program.addCommand(templatesCommand());
program.addCommand(generateCommand());

program.parseAsync(process.argv).catch((error) => {
  console.error("执行错误:", error.message);
  process.exit(1);
});
