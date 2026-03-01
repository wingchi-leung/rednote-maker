import Link from "next/link";

export function LandingCta() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          马上试试，完全免费
        </h2>
        <p className="text-gray-500 mb-8">
          无需登录，打开浏览器即可把 Markdown 变成小红书卡片
        </p>
        <Link
          href="/editor"
          className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-apple-blue text-white font-medium text-base hover:bg-[#0066cc] transition-colors shadow-lg shadow-apple-blue/20"
        >
          进入编辑器
        </Link>
      </div>
    </section>
  );
}
