"use client";

export function LandingPreviewCard() {
  return (
    <section className="py-20 px-6 bg-apple-gray6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          所见即所得
        </h2>
        <p className="text-gray-500 mb-12">
          左侧编辑 Markdown，右侧实时预览卡片，导出即发小红书
        </p>
        {/* 3:4 卡片 mock */}
        <div className="flex justify-center">
          <div
            className="w-full max-w-[280px] rounded-2xl bg-white shadow-xl shadow-black/8 border border-apple-border overflow-hidden"
            style={{ aspectRatio: "3/4" }}
          >
            <div className="h-full flex flex-col p-6 text-left">
              <div className="h-2 w-12 rounded-full bg-apple-gray6 mb-6" />
              <div className="space-y-3 flex-1">
                <div className="h-3 w-full rounded bg-apple-gray6/80" />
                <div className="h-3 w-4/5 rounded bg-apple-gray6/60" />
                <div className="h-3 w-full rounded bg-apple-gray6/80" />
                <div className="h-3 w-3/4 rounded bg-apple-gray6/60" />
              </div>
              <div className="mt-4 pt-4 border-t border-apple-border">
                <div className="h-2 w-20 rounded bg-apple-blue/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
