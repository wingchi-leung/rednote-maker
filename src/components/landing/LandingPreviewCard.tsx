"use client";

import Image from "next/image";

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
        <div className="flex justify-center">
          <div className="w-full max-w-[280px] rounded-2xl overflow-hidden shadow-xl shadow-black/8 border border-apple-border">
            <Image
              src="/image.png"
              alt="RedNoteMaker 编辑与预览界面示意"
              width={840}
              height={1120}
              className="w-full h-auto object-cover"
              style={{ aspectRatio: "3/4" }}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
