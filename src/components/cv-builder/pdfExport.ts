import type { CvData, CvTemplate } from "./types";

/**
 * Generate a PDF Blob using @react-pdf/renderer.
 * Falls back to ModernCVDocument for all new templates (HTML-only templates
 * don't have a @react-pdf equivalent yet — PDF support can be added per template).
 * Lazy-imports to stay client-only (no SSR issues).
 */
export async function exportCvToPdf(data: CvData, template: CvTemplate): Promise<Blob> {
  const [{ pdf }, { createElement }, templates] = await Promise.all([
    import("@react-pdf/renderer"),
    import("react"),
    import("./templates"),
  ]);

  // Map templates that have a full @react-pdf Document component.
  // New HTML-based templates fall back to ModernCVDocument.
  const docMap = {
    modern: templates.ModernCVDocument,
    azurill: templates.ModernCVDocument,
    bronzor: templates.CreativeCVDocument,
    onyx: templates.ModernCVDocument,
    ditto: templates.ATSCVDocument,
    pikachu: templates.CreativeCVDocument,
  } satisfies Record<CvTemplate, React.ComponentType<{ data: CvData }>>;

  // Convert new CvData shape to legacy shape expected by old Document components
  const legacyData = toLegacyCvData(data);

  const Component = docMap[template] ?? docMap.modern;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(createElement(Component, { data: legacyData }) as any).toBlob();
}

/**
 * Convert extended CvData (new) to the minimal shape the old @react-pdf
 * Document components expect. They only use a subset of fields.
 */
function toLegacyCvData(data: CvData): CvData {
  return {
    ...data,
    personal: { ...data.personal, objetivo: data.objetivo },
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
