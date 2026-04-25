"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesCommand = templatesCommand;
const commander_1 = require("commander");
const templates_1 = require("@/lib/templates");
function templatesCommand() {
    const cmd = new commander_1.Command("templates");
    cmd
        .description("列出所有可用的模板")
        .option("--json", "以 JSON 格式输出模板列表")
        .action((options) => {
        if (options.json) {
            console.log(JSON.stringify(formatTemplatesForJson(templates_1.TEMPLATES), null, 2));
        }
        else {
            printTemplatesTable(templates_1.TEMPLATES);
        }
    });
    return cmd;
}
function formatTemplatesForJson(templates) {
    return templates.map((t) => ({
        id: t.id,
        label: t.label,
        layout: t.layout,
        colors: {
            background: t.colors.background,
            text: t.colors.text,
            accent: t.colors.accent,
        },
        hasDecoration: !!t.decoration,
        hasCardFrame: !!t.cardFrame,
    }));
}
function printTemplatesTable(templates) {
    console.log("\n📋 可用模板列表\n");
    console.log("┌─────────────────────────────────────────────────────────────────────────────────┐");
    console.log("│ ID                │ 名称              │ 布局类型          │ 强调色        │");
    console.log("├─────────────────────────────────────────────────────────────────────────────────┤");
    for (const t of templates) {
        const id = t.id.padEnd(18);
        const label = t.label.padEnd(18);
        const layout = t.layout.padEnd(18);
        const accent = t.colors.accent.padEnd(14);
        console.log(`│ ${id}│ ${label}│ ${layout}│ ${accent}│`);
    }
    console.log("└─────────────────────────────────────────────────────────────────────────────────┘");
    console.log("\n📝 使用示例:");
    console.log("  rednotemaker generate --template classic --content \"# 我的内容\"");
    console.log("  rednotemaker generate --template dark --input ./article.md --output ./output");
    console.log("");
}
