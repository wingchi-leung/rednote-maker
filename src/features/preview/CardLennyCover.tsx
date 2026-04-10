"use client";

import { CARD_FONT_FAMILY } from "@/features/preview/CardMarkdownContent";

interface CardLennyCoverProps {
  /** 标题区域的 Markdown 内容（暂未渲染，留作扩展） */
  titleText?: string;
  accentColor: string;
  textColor: string;
}

export function CardLennyCover({ accentColor, textColor }: CardLennyCoverProps) {
  return (
    <div
      style={{
        fontFamily: CARD_FONT_FAMILY,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* 上方 40%：头像居左 + 介绍文字 */}
      <div
        style={{
          flex: "2 0 0",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        {/* 头像 */}
        <img
          src="/lenny_headshot.png"
          alt="Lenny Rachitsky"
          style={{
            width: "108px",
            height: "108px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: `3px solid ${accentColor}`,
          }}
        />

        {/* 介绍文字 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
            }}
          >
            Lenny Rachitsky
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "#999999",
              lineHeight: 1.7,
            }}
          >
            前 Airbnb 产品经理
            <br />
            打造百万 Newsletter 的内容创作者
          </span>
        </div>
      </div>

      {/* 下方 60%：标题区域，背景 #FAECE1，留空 */}
      <div
        style={{
          flex: "3 0 0",
          backgroundColor: "#FAECE1",
          padding: "32px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* 标题占位区域 —— 用户可在此填写标题 */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
