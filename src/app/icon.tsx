import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#ff2442",
          color: "#ffffff",
          borderRadius: "12px",
          border: "2px solid #e01e3c",
          boxSizing: "border-box",
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: "-0.08em",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          lineHeight: 1,
        }}
      >
        RM
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 8,
            background: "rgba(255, 255, 255, 0.82)",
          }}
        />
      </div>
    ),
    size
  );
}
