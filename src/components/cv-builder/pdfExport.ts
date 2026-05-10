import type { CvData, CvTemplate } from "./types";

/**
 * Generate a real PDF Blob using @react-pdf/renderer.
 * Lazy-imports to stay client-only (no SSR issues).
 */
export async function exportCvToPdf(data: CvData, template: CvTemplate): Promise<Blob> {
  const [{ pdf }, { createElement }, templates] = await Promise.all([
    import("@react-pdf/renderer"),
    import("react"),
    import("./templates"),
  ]);

  const map = {
    modern:   templates.ModernCVDocument,
    creative: templates.CreativeCVDocument,
    ats:      templates.ATSCVDocument,
  } as const;

  const Component = map[template] ?? map.modern;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(createElement(Component, { data }) as any).toBlob();
}

/**
 * Trigger browser download of a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
