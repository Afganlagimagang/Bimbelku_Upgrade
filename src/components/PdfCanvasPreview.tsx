import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfCanvasPreview({ url, blob }: { url: string; blob?: Blob }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    setDocument(null);
    setPageNumber(1);
    setError("");
    setLoading(true);
    let loadingTask: ReturnType<typeof getDocument> | null = null;

    const load = async () => {
      try {
        let bytes: ArrayBuffer;
        if (blob) {
          bytes = await blob.arrayBuffer();
        } else {
          const response = await fetch(url);
          if (!response.ok) throw new Error("PDF tidak dapat dibaca.");
          bytes = await response.arrayBuffer();
        }
        const data = new Uint8Array(bytes);
        if (disposed) return;
        loadingTask = getDocument({ data });
        const pdf = await loadingTask.promise;
        if (disposed) {
          await pdf.destroy();
          return;
        }
        setDocument(pdf);
      } catch {
        if (!disposed) setError("Pratinjau PDF gagal dimuat. Coba buka berkas di tab baru.");
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void load();
    return () => {
      disposed = true;
      void loadingTask?.destroy();
    };
  }, [url, blob]);

  useEffect(() => {
    if (!document) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let disposed = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null;
    setRendering(true);
    setError("");

    const render = async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (disposed) return;
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * pixelRatio);
        canvas.height = Math.ceil(viewport.height * pixelRatio);
        canvas.style.width = `${Math.ceil(viewport.width)}px`;
        canvas.style.height = `${Math.ceil(viewport.height)}px`;
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
      } catch (cause) {
        if (!disposed && !(cause instanceof Error && cause.name === "RenderingCancelledException")) {
          setError("Halaman PDF tidak dapat ditampilkan. Coba buka di tab baru.");
        }
      } finally {
        if (!disposed) setRendering(false);
      }
    };

    void render();
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, scale]);

  return (
    <div className="flex min-h-full flex-col items-center gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-900/95 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur">
        <button type="button" disabled={!document || pageNumber <= 1} onClick={() => setPageNumber((page) => page - 1)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-40" aria-label="Halaman sebelumnya"><ChevronLeft size={18} /></button>
        <span className="min-w-28 text-center">{document ? `Halaman ${pageNumber} / ${document.numPages}` : "Memuat PDF…"}</span>
        <button type="button" disabled={!document || pageNumber >= document.numPages} onClick={() => setPageNumber((page) => page + 1)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-40" aria-label="Halaman berikutnya"><ChevronRight size={18} /></button>
        <span className="mx-1 h-5 w-px bg-white/20" />
        <button type="button" disabled={scale <= 0.75} onClick={() => setScale((value) => Math.max(0.75, value - 0.25))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-40" aria-label="Perkecil PDF"><ZoomOut size={17} /></button>
        <span className="min-w-10 text-center">{Math.round(scale * 100)}%</span>
        <button type="button" disabled={scale >= 2} onClick={() => setScale((value) => Math.min(2, value + 0.25))} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-40" aria-label="Perbesar PDF"><ZoomIn size={17} /></button>
      </div>
      {(loading || rendering) && <p className="flex items-center gap-2 text-xs text-slate-300"><Loader2 size={15} className="animate-spin" />Menyiapkan halaman PDF…</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</p>}
      <canvas ref={canvasRef} className={`max-w-none bg-white shadow-2xl ${document ? "" : "hidden"}`} aria-label={`Halaman ${pageNumber} laporan PDF`} role="img" />
    </div>
  );
}
