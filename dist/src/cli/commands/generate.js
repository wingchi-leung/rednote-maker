"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const templates_1 = require("@/lib/templates");
const renderer_1 = require("../renderer");
function generateCommand() {
    const cmd = new commander_1.Command("generate");
    cmd
        .description("根据 Markdown 内容和模板生成小红书图文卡片")
        .requiredOption("-c, --content <text>", "Markdown 内容文本")
        .addOption(new commander_1.Option("-t, --template <id>", "使用的模板 ID")
        .default("classic")
        .choices(templates_1.TEMPLATES.map((t) => t.id)))
        .option("-o, --output <dir>", "输出目录（默认为当前目录）", ".")
        .addOption(new commander_1.Option("--font-size <size>", "字体大小")
        .default("md")
        .choices(["sm", "md", "lg"]))
        .addOption(new commander_1.Option("--density <density>", "内容密度")
        .default("comfortable")
        .choices(["compact", "comfortable", "spacious"]))
        .addOption(new commander_1.Option("--alignment <alignment>", "文本对齐方式")
        .default("left")
        .choices(["left", "center", "justify"]))
        .option("--footer-text <text>", "页脚文字（可选）")
        .option("--json", "以 JSON 格式输出结果")
        .option("--debug", "启用调试模式（保留临时文件）")
        .action(async (options) => {
        await handleGenerate(options);
    });
    return cmd;
}
async function handleGenerate(options) {
    const result = {
        success: false,
        totalPages: 0,
        outputFiles: [],
        template: options.template,
        contentLength: options.content.length,
    };
    try {
        const outputDir = path_1.default.resolve(options.output);
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const generateOptions = {
            markdown: options.content,
            theme: options.template,
            fontSize: options.fontSize,
            density: options.density,
            alignment: options.alignment,
            footerText: options.footerText,
            outputDir,
            debug: options.debug,
        };
        const outputFiles = await (0, renderer_1.generateImages)(generateOptions);
        result.success = true;
        result.totalPages = outputFiles.length;
        result.outputFiles = outputFiles;
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            printResult(result);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.error = errorMessage;
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.error("❌ 生成失败:", errorMessage);
            if (options.debug && error instanceof Error && error.stack) {
                console.error(error.stack);
            }
        }
        process.exit(1);
    }
}
function printResult(result) {
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
