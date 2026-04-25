import { Command, Option } from "commander";
import fs from "fs";
import path from "path";
import { TEMPLATES, type Theme } from "@/lib/templates";
import { generateImages } from "../renderer";
import type { FontSize, Density, Alignment } from "@/store/useContentThemeStore";

export function generateCommand(): Command {
  const cmd = new Command("generate");
  cmd
    .description("根据 Markdown 内容和模板生成小红书图文卡片")
    .requiredOption("-c, --content <text>", "Markdown 内容文本")
    .addOption(
      new Option("-t, --template <id>", "使用的模板 ID")
        .default("classic")
        .choices(TEMPLATES.map((t) => t.id))
    )
    .option("-o, --output <dir>", "输出目录（默认为当前目录）", ".")
    .addOption(
      new Option("--font-size <size>", "字体大小")
        .default("md")
        .choices(["sm", "md", "lg"])
    )
    .addOption(
      new Option("--density <density>", "内容密度")
        .default("comfortable")
        .choices(["compact", "comfortable", "spacious"])
    )
    .addOption(
      new Option("--alignment <alignment>", "文本对齐方式")
        .default("left")
        .choices(["left", "center", "justify"])
    )
    .option("--footer-text <text>", "页脚文字（可选）")
    .option("--json", "以 JSON 格式输出结果")
    .option("--debug", "启用调试模式（保留临时文件）")
    .action(async (options) => {
      await handleGenerate(options);
    });

  return cmd;
}

interface GenerateOptions {
  content: string;
  template: string;
  output: string;
  fontSize: string;
  density: string;
  alignment: string;
  footerText?: string;
  json?: boolean;
  debug?: boolean;
}

interface GenerateResult {
  success: boolean;
  totalPages: number;
  outputFiles: string[];
  template: string;
  contentLength: number;
  error?: string;
}

async function handleGenerate(options: GenerateOptions): Promise<void> {
  const result: GenerateResult = {
    success: false,
    totalPages: 0,
    outputFiles: [],
    template: options.template,
    contentLength: options.content.length,
  };

  try {
    const outputDir = path.resolve(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const generateOptions = {
      markdown: options.content,
      theme: options.template as Theme,
      fontSize: options.fontSize as FontSize,
      density: options.density as Density,
      alignment: options.alignment as Alignment,
      footerText: options.footerText,
      outputDir,
      debug: options.debug,
    };

    const outputFiles = await generateImages(generateOptions);

    result.success = true;
    result.totalPages = outputFiles.length;
    result.outputFiles = outputFiles;

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printResult(result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.error = errorMessage;

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error("❌ 生成失败:", errorMessage);
      if (options.debug && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

function printResult(result: GenerateResult): void {
  console.log("\n✅ 图片生成成功！\n");
  console.log(`📊 统计信息:`);
  console.log(`   模板: ${result.template}`);
  console.log(`   内容长度: ${result.contentLength} 字符`);
  console.log(`   生成页数: ${result.totalPages} 页\n`);
  console.log(`📁 输出文件:`);

  for (const file of result.outputFiles) {
    console.log(`   - ${file}`);
  }

  console.log("");
}
