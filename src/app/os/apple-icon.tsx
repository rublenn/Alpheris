import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #14161d 0%, #0b0c10 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 22,
            background: "#ff5a3c",
            fontSize: 56,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "Helvetica, Arial, sans-serif",
            letterSpacing: -2,
          }}
        >
          A
        </div>
      </div>
    ),
    { ...size }
  );
}
