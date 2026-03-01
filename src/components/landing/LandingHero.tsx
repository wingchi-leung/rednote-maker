import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* 柔和背景形状 */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-apple-blue/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-apple-blue/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <p
          className="text-apple-blue font-medium text-sm tracking-widest uppercase mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
        >
          Content First, Design Second
        </p>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 tracking-tight mb-5 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
        >
          RedNoteMaker
        </h1>
        <p
          className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed opacity-0 animate-fade-in"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          极简主义的 Markdown 转小红书卡片工具。写内容，自动分页，一键导出高清图。
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in"
          style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
        >
          <Link
            href="/editor"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-apple-blue text-white font-medium text-base hover:bg-[#0066cc] transition-colors shadow-lg shadow-apple-blue/20"
          >
            开始制作
          </Link>
          <span className="text-gray-400 text-sm self-center">无需注册，打开即用</span>
        </div>
      </div>
    </section>
  );
}
