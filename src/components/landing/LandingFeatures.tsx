const features = [
  {
    title: "智能分页",
    description:
      "针对 3:4 画布自动计算文本高度，超长内容自动拆分为多张卡片；支持 --- 强制分页与标题语义断点，长文也能优雅排版。",
    accent: "01",
  },
  {
    title: "Markdown 增强",
    description:
      "适配 Notion、Obsidian、标准与严格 Markdown，写你习惯的语法即可，自动完成 Markdown to card 转换与图文排版。",
    accent: "02",
  },
  {
    title: "小红书 / 微信风格",
    description:
      "多款 Apple 风格与小红书风格卡片主题（经典白、深空灰、羊皮纸、莫兰迪），适合小红书、微信图文卡片制作。",
    accent: "03",
  },
  {
    title: "一键导出",
    description:
      "1242×1660 高清 PNG，一键导出图片，可单张或批量打包下载，直接发布。",
    accent: "04",
  },
];

export function LandingFeatures() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
          markdown 转卡片，适配小红书，小绿书
        </h2>
        <p className="text-gray-500 text-center mb-14">
          从写作到成图，少点折腾，多点创作
        </p>
        <ul className="grid gap-10 sm:grid-cols-2">
          {features.map((item, i) => (
            <li
              key={item.accent}
              className="flex gap-5 p-5 rounded-2xl bg-apple-gray6/60 hover:bg-apple-gray6 transition-colors"
              style={{
                animationDelay: `${0.1 * i}s`,
              }}
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-apple-blue/10 text-apple-blue font-semibold text-sm flex items-center justify-center">
                {item.accent}
              </span>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
