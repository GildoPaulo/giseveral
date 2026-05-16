import type React from "react";
import type { CvDataV2, CvSettings } from "../types";

export type TemplateProps = {
  data: CvDataV2;
  settings: CvSettings;
};

export const fullName = (data: CvDataV2) => `${data.firstName} ${data.lastName}`.trim() || "O meu curriculo";

export function bullets(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);
}

export function shell(settings: CvSettings): React.CSSProperties {
  return {
    width: "794px",
    minHeight: "1123px",
    background: "#ffffff",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: 1.35 + settings.spacing * 0.08,
  };
}

export function Footer({ data, color = "#9CA3AF" }: { data: CvDataV2; color?: string }) {
  return (
    <div style={{ padding: "10px 28px", color, fontSize: "9px", fontFamily: "Arial", textAlign: "center" }}>
      {fullName(data)} · giseveral.com
    </div>
  );
}

export function Photo({ data, size = 86, border = "#ffffff" }: { data: CvDataV2; size?: number; border?: string }) {
  if (!data.photo) return null;
  return (
    <img
      src={data.photo}
      alt=""
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: data.roundPhoto ? "999px" : "8px",
        objectFit: "cover",
        border: `3px solid ${border}`,
        display: "block",
      }}
    />
  );
}

export function Progress({ level, color }: { level: number; color: string }) {
  return (
    <div style={{ height: "6px", background: "#D1D5DB", borderRadius: "99px", overflow: "hidden", marginTop: "4px" }}>
      <div style={{ width: `${Math.max(1, Math.min(5, level)) * 20}%`, height: "100%", background: color }} />
    </div>
  );
}

export function showSection(data: CvDataV2, key: string) {
  const section = data.sections.find((item) => item.key === key);
  return section ? section.visible && section.enabled : true;
}
