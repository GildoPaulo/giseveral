import type { CvData, CvTemplate } from "./types";

/**
 * Generate a PDF Blob by rendering the *actual* HTML preview component used
 * on screen into an off-screen DOM node, then capturing it page-by-page with
 * html2canvas and packaging the slices into a jsPDF A4 document.
 *
 * Why this approach instead of @react-pdf/renderer?
 *   The 6 local templates (Azurill, Bronzor, Onyx, Ditto, Pikachu, Modern) are
 *   React HTML components, not @react-pdf <Document> trees. The previous map
 *   funneled all of them through 3 unrelated legacy Documents (ModernCVDocument,
 *   CreativeCVDocument, ATSCVDocument) — producing wrong layouts or crashes
 *   ("PDF corrompido") on every template except Modern. Rasterising the live
 *   preview is the only way to keep PDF output 1:1 with what the user sees,
 *   without rewriting every template twice.
 *
 * Required deps:   html2canvas  jspdf  react-dom
 *   npm i html2canvas jspdf
 */
export async function exportCvToPdf(data: CvData, template: CvTemplate): Promise<Blob> {
  const [
    { default: html2canvas },
    jspdfMod,
    { createElement },
    reactDom,
    templates,
  ] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
    import("react"),
    import("react-dom/client"),
    import("./templates"),
  ]);
  const jsPDF = jspdfMod.jsPDF ?? (jspdfMod as unknown as { default: typeof import("jspdf").jsPDF }).default;

  const PREVIEW_MAP: Record<Exclude<CvTemplate, "custom">, React.ComponentType<{ data: CvData }>> = {
    azurill: templates.AzurillPreview,
    bronzor: templates.BronzorPreview,
    onyx: templates.OnyxPreview,
    ditto: templates.DittoPreview,
    pikachu: templates.PikachuPreview,
    modern: templates.ModernPreview,
  };

  const Component = template === "custom"
    ? PREVIEW_MAP.modern
    : (PREVIEW_MAP[template as Exclude<CvTemplate, "custom">] ?? PREVIEW_MAP.modern);

  // Off-screen render target — sits outside the viewport so layout/paint runs
  // but the user never sees it. Width matches the A4 px size the templates use.
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: -10000px",
    "width: 794px",
    "background: #ffffff",
    "z-index: -1",
    "pointer-events: none",
  ].join(";");
  document.body.appendChild(host);

  const root = reactDom.createRoot(host);
  root.render(createElement(Component, { data }));

  try {
    // Wait for React commit + image/font load
    await new Promise(r => requestAnimationFrame(() => r(null)));
    await new Promise(r => setTimeout(r, 350));
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch { /* ignore */ }
    }
    // Wait for any <img> elements inside to finish loading
    const imgs = Array.from(host.querySelectorAll("img"));
    await Promise.all(
      imgs.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>(res => {
              img.addEventListener("load", () => res(), { once: true });
              img.addEventListener("error", () => res(), { once: true });
            })
      )
    );

    const node = host.firstElementChild as HTMLElement | null;
    if (!node) throw new Error("Template não renderizou — preview vazio");

    // Capture at 2x for crisp text
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    // A4 = 210 × 297 mm
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWmm = pdf.internal.pageSize.getWidth();   // 210
    const pageHmm = pdf.internal.pageSize.getHeight();  // 297

    const pxPerMm = canvas.width / pageWmm;
    const pagePxH = Math.floor(pageHmm * pxPerMm);

    let yPx = 0;
    let pageIndex = 0;

    while (yPx < canvas.height) {
      const sliceH = Math.min(pagePxH, canvas.height - yPx);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context indisponível");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
      const sliceHmm = sliceH / pxPerMm;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pageWmm, sliceHmm, undefined, "FAST");

      yPx += sliceH;
      pageIndex++;

      // Safety guard — never more than 10 pages for a CV
      if (pageIndex > 10) break;
    }

    return pdf.output("blob");
  } finally {
    try { root.unmount(); } catch { /* ignore */ }
    host.remove();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so Safari has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
