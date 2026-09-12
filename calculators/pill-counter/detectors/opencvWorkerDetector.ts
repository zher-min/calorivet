import type { DetectorResult, PillDetector } from "../types";
import { PILL_DETECTION_CONFIG } from "../detectorConfig";

export const opencvWorkerDetector: PillDetector & { dispose: () => void } = (() => {
  let worker: Worker | null = null;
  let request = 0;
  const pending = new Map<number, { resolve: (v: DetectorResult) => void; reject: (e: Error) => void; timer: number }>();
  const ensureWorker = () => {
    if (worker) return worker;
    worker = new Worker("/workers/pill-counter-opencv.worker.js");
    worker.onmessage = (event) => { const m = event.data; const item = pending.get(m.requestId); if (!item) return; if (m.type === "result") { window.clearTimeout(item.timer); pending.delete(m.requestId); item.resolve(m.result); } else if (m.type === "error") { window.clearTimeout(item.timer); pending.delete(m.requestId); item.reject(new Error(m.error)); } };
    worker.onerror = () => { pending.forEach(item => { window.clearTimeout(item.timer); item.reject(new Error("Automatic detection is unavailable on this device.")); }); pending.clear(); worker?.terminate(); worker = null; };
    return worker;
  };
  return { detect(canvas, options = {}) { const image = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height); if (!image) return Promise.reject(new Error("Could not prepare image for detection.")); const id = ++request; return new Promise((resolve, reject) => { const timer = window.setTimeout(() => { pending.delete(id); worker?.terminate(); worker = null; reject(new Error("Detection took too long. You can retry or count using manual markers.")); }, 30000); pending.set(id, { resolve, reject, timer }); ensureWorker().postMessage({ type: "detect", requestId: id, width: image.width, height: image.height, pixelBuffer: image.data.buffer, config: PILL_DETECTION_CONFIG, debug: Boolean(options.debug) }, [image.data.buffer]); }); }, dispose() { pending.forEach(item => { window.clearTimeout(item.timer); item.reject(new Error("Detection cancelled.")); }); pending.clear(); worker?.terminate(); worker = null; } };
})();
