import { Command } from "commander";
import { TEMPLATES, type TemplateConfig } from "@/lib/templates";

export function templatesCommand(): Command {
  const cmd = new Command("templates");
  cmd
    .description("列出所有可用的模板")
    .option("--json", "以 JSON 格式输出模板列表")
    .action((options) => {
      if (options.json) {
        console.log(JSON.stringify(formatTemplatesForJson(TEMPLATES), null, 2));
      } else {
        printTemplatesTable(TEMPLATES);
      }
    });

  return cmd;
}

interface TemplateInfo {
  id: string;
  label: string;
  layout: string;
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  hasDecoration: boolean;
  hasCardFrame: boolean;
}

function formatTemplatesForJson(templates: readonly TemplateConfig[]): TemplateInfo[] {
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

function printTemplatesTable(templates: readonly TemplateConfig[]): void {
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
