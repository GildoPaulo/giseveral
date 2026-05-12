import type { CSSProperties } from "react";

export const A4_HEIGHT = 1123;

export const wrapTextStyle: CSSProperties = {
  overflowWrap: "break-word",
  wordWrap: "break-word",
  whiteSpace: "normal",
};

export const breakTextStyle: CSSProperties = {
  ...wrapTextStyle,
  wordBreak: "break-word",
};

export const flexColumnStyle: CSSProperties = {
  minWidth: 0,
  ...wrapTextStyle,
};

export const a4PageStyle: CSSProperties = {
  width: 794,
  minHeight: A4_HEIGHT,
  boxSizing: "border-box",
  ...wrapTextStyle,
};

export const longTextStyle: CSSProperties = {
  ...breakTextStyle,
  hyphens: "auto",
};
