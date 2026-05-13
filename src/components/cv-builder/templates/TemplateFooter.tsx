import type { CvData } from "../types";

export function TemplateFooter({
  data,
  color = "#9ca3af",
  borderColor = "#e5e7eb",
}: {
  data: CvData;
  color?: string;
  borderColor?: string;
}) {
  const name = data.personal.nome || "CV";
  const email = data.personal.email;
  const date = new Date().toLocaleDateString("pt-MZ");

  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 8,
        borderTop: `1px solid ${borderColor}`,
        color,
        fontSize: 8.5,
        lineHeight: 1.4,
        textAlign: "center",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      {[name, email, `Actualizado em ${date}`].filter(Boolean).join(" · ")}
    </div>
  );
}
