/**
 * Render the first page of a PDF (as a File / ArrayBuffer / URL) to a Blob.
 * Uses pdfjs-dist directly — no react-pdf in this path so it stays cheap and
 * works server-side-rendered routes that import it.
 */

type Source = File | Blob | ArrayBuffer | string;

// Keep in sync with package.json pdfjs-dist version + DocumentViewer.tsx
const PDFJS_VERSION = "5.7.284";

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

async function sourceToData(src: Source): Promise<ArrayBuffer | string> {
  if (typeof src === "string") return src;
  if (src instanceof ArrayBuffer) return src;
  return await src.arrayBuffer();
}

export async function generatePdfThumbnail(
  src: Source,
  opts: { maxWidth?: number; mime?: "image/png" | "image/jpeg"; quality?: number } = {},
): Promise<Blob> {
  const { maxWidth = 480, mime = "image/jpeg", quality = 0.86 } = opts;

  const pdfjs = await loadPdfjs();
  const data = await sourceToData(src);

  const loadingTask = typeof data === "string"
    ? pdfjs.getDocument(data)
    : pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(1);

  // Pick a render scale that produces ~maxWidth px wide output.
  const viewport0 = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport0.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");

  await page.render({ canvasContext: context, viewport, canvas }).promise;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))), mime, quality);
  });
}
