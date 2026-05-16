import type { CvExperiencia } from "../types";

type Props = {
  exp: CvExperiencia;
  fontSize?: number;
  lineHeight?: number;
  marginTop?: number;
  opacity?: number;
  /** Whitelist of styles passed through (e.g. word-wrap rules) */
  textStyle?: React.CSSProperties;
};

/**
 * Renders the body of an experience entry: a bullet list when `bullets[]`
 * has content, otherwise the legacy `descricao` paragraph. Used by every
 * built-in template for consistency.
 */
export function ExperienceBody({
  exp,
  fontSize = 10,
  lineHeight = 1.6,
  marginTop = 4,
  opacity = 0.75,
  textStyle,
}: Props) {
  const bullets = (exp.bullets ?? []).filter((b) => b.trim().length > 0);

  if (bullets.length > 0) {
    return (
      <ul
        style={{
          margin: `${marginTop}px 0 0 0`,
          paddingLeft: 16,
          fontSize,
          lineHeight,
          opacity,
          listStyleType: "disc",
          ...textStyle,
        }}
      >
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 2 }}>{b}</li>
        ))}
      </ul>
    );
  }

  if (exp.descricao) {
    return (
      <p style={{ fontSize, lineHeight, marginTop, opacity, ...textStyle }}>
        {exp.descricao}
      </p>
    );
  }

  return null;
}
