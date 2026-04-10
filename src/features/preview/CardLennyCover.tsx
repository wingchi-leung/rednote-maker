"use client";

import { CARD_FONT_FAMILY } from "@/features/preview/CardMarkdownContent";

interface CardLennyCoverProps {
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
      {/* 上方白色区（40%）：左侧 bio，右下角小圆头像 */}
      <div
        style={{
          flex: "2 0 0",
          position: "relative",
          padding: "32px 36px 28px 36px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* 左侧作者信息，垂直居底 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.3,
            }}
          >
            Lenny Rachitsky
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#AAAAAA",
              lineHeight: 1.8,
            }}
          >
            前 Airbnb 产品经理
            <br />
            打造百万 Newsletter 的内容创作者
          </span>
        </div>

        {/* 右下角小圆头像 */}
        <img
          src="/lenny_headshot.png"
          alt="Lenny Rachitsky"
          style={{
            position: "absolute",
            right: "36px",
            bottom: "24px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            objectFit: "cover",
            border: `2.5px solid ${accentColor}`,
          }}
        />
      </div>

      {/* 分隔线 */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#EBEBEB",
          flexShrink: 0,
        }}
      />

      {/* 下方 #FAECE1 区（60%）：大标题，视觉重心 */}
      <div
        style={{
          flex: "3 0 0",
          backgroundColor: "#FAECE1",
          padding: "36px 36px 40px 36px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* 标题留空，用户填写 */}
        <p
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.35,
            letterSpacing: "-0.5px",
          }}
        />
      </div>
    </div>
  );
}
