"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { opencvWorkerDetector } from "./detectors/opencvWorkerDetector";
import { PILL_DETECTION_CONFIG } from "./detectorConfig";
import type { Detection, DetectionDiagnostics } from "./types";

const makeId = () => `pill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function PillCounter() {
  const cameraRef = useRef<HTMLInputElement>(null); const chooseRef = useRef<HTMLInputElement>(null); const imageRef = useRef<HTMLImageElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null);
  const [testingEnabled, setTestingEnabled] = useState(false);
  const [target, setTarget] = useState(""); const [imageUrl, setImageUrl] = useState<string | null>(null); const [detections, setDetections] = useState<Detection[]>([]); const [history, setHistory] = useState<Detection[][]>([]); const [processing, setProcessing] = useState(false); const [confirmed, setConfirmed] = useState(false); const [showNumbers, setShowNumbers] = useState(false); const [error, setError] = useState<string | null>(null); const [diagnostics, setDiagnostics] = useState<DetectionDiagnostics | null>(null);
  const targetNumber = target.trim() === "" ? null : Number(target); const count = detections.length; const difference = targetNumber === null || !Number.isInteger(targetNumber) || targetNumber <= 0 ? null : targetNumber - count;
  const status = difference === null ? `${count} TABLETS DETECTED` : difference > 0 ? `ADD ${difference} MORE` : difference < 0 ? `REMOVE ${Math.abs(difference)}` : "CORRECT QUANTITY";
  const chooseFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) { setError("Choose an image file to begin."); return; }
    setError(null); setConfirmed(false); setDetections([]); setHistory([]); setDiagnostics(null); setProcessing(true);
    try {
      // Never mount the original 12–50 MP camera image. Downsample before it reaches the DOM.
      const bitmap = await createImageBitmap(file);
      const reportedMemory = typeof navigator !== "undefined" && "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) : 0;
      const maxDimension = reportedMemory > 0 && reportedMemory <= 2 ? 512 : PILL_DETECTION_CONFIG.maxProcessingDimension;
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not prepare image.")), "image/jpeg", 0.88));
      const nextUrl = URL.createObjectURL(blob);
      setImageUrl(old => { if (old) URL.revokeObjectURL(old); return nextUrl; });
    } catch { setError("This device could not prepare the photo. Try a smaller image or use manual markers."); setProcessing(false); }
  };
  const processImage = useCallback(async () => { if (!imageRef.current || !canvasRef.current) return; const image = imageRef.current; const canvas = canvasRef.current; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext("2d")?.drawImage(image, 0, 0); setError(null); try { const result = await opencvWorkerDetector.detect(canvas, { debug: process.env.NODE_ENV !== "production" }); setDetections(result.detections); setDiagnostics(result.diagnostics ?? null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not detect tablets in this image."); } finally { setProcessing(false); } }, []);
  useEffect(() => () => { opencvWorkerDetector.dispose(); if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  const onImageClick = (event: React.MouseEvent<HTMLDivElement>) => { if (confirmed || processing) return; const rect = event.currentTarget.getBoundingClientRect(); const x = clamp((event.clientX - rect.left) / rect.width); const y = clamp((event.clientY - rect.top) / rect.height); const hit = detections.findIndex(item => Math.hypot((item.x - x) * rect.width, (item.y - y) * rect.height) < 24); setHistory(previous => [...previous, detections]); setDetections(current => hit >= 0 ? current.filter((_, index) => index !== hit) : [...current, { id: makeId(), x, y, source: "manual", confidence: null }]); };
  const undo = () => { const previous = history.at(-1); if (!previous || confirmed) return; setDetections(previous); setHistory(current => current.slice(0, -1)); };
  const reset = () => { opencvWorkerDetector.dispose(); setProcessing(false); setTarget(""); setDetections([]); setHistory([]); setDiagnostics(null); setError(null); setConfirmed(false); setImageUrl(old => { if (old) URL.revokeObjectURL(old); return null; }); };
  const retake = () => { opencvWorkerDetector.dispose(); setProcessing(false); setDetections([]); setHistory([]); setDiagnostics(null); setError(null); setConfirmed(false); cameraRef.current?.click(); };
  const ordered = useMemo(() => [...detections].sort((a, b) => a.y - b.y || a.x - b.x), [detections]);
  if (!testingEnabled) return <main className="toolkit-workspace pill-page"><div className="toolkit-intro"><h1>Pill Counter</h1></div><section className="pill-wip" aria-labelledby="pill-wip-title"><span>WORK IN PROGRESS</span><h2 id="pill-wip-title">Pill Counter is currently being tested</h2><p>The detector may temporarily slow or freeze some devices while processing a photo. Other VetTools calculators are unaffected.</p><button type="button" className="toolkit-button" onClick={() => setTestingEnabled(true)}>Test Pill Counter anyway</button></section></main>;
  return <main className="toolkit-workspace pill-page"><div className="toolkit-intro"><h1>Pill Counter</h1><p>Count tablets or capsules from a photo. Processing stays on this device.</p></div>
    <section className="pill-controls" aria-label="Pill counter controls"><label><span>Required quantity <small>(optional)</small></span><input type="number" min="1" step="1" inputMode="numeric" value={target} onChange={event => setTarget(event.target.value)} /></label><div className="pill-actions"><button type="button" className="toolkit-button" onClick={() => cameraRef.current?.click()}>Take Photo</button><button type="button" className="toolkit-button secondary" onClick={() => chooseRef.current?.click()}>Choose Photo</button></div><input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={event => chooseFile(event.target.files?.[0])} /><input ref={chooseRef} hidden type="file" accept="image/*" onChange={event => chooseFile(event.target.files?.[0])} /></section>
    {imageUrl && <section className="pill-workspace" aria-label="Detected tablets"><div className="pill-photo" onClick={onImageClick} role="button" tabIndex={0} aria-label="Tablet image. Tap a marker to remove it or an empty location to add one." onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); } }}><img ref={imageRef} src={imageUrl} alt="Uploaded tablet photograph" onLoad={processImage} /><div className="pill-markers">{ordered.map((item, index) => <button type="button" key={item.id} className="pill-marker" style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }} aria-label={`Tablet ${index + 1}; tap to remove`} onClick={event => { event.stopPropagation(); if (!confirmed) { setHistory(previous => [...previous, detections]); setDetections(current => current.filter(candidate => candidate.id !== item.id)); } }}>{showNumbers ? index + 1 : ""}</button>)}</div>{processing && <div className="pill-processing">Detecting tablets…</div>}</div><canvas ref={canvasRef} hidden />
      {error && <p className="pill-error">{error}</p>}{diagnostics?.suspicious && <p className="pill-quality">Check the detected markers before confirming.</p>}
      <div className="pill-result" aria-live="polite"><div><span>Detected</span><strong>{count}</strong></div>{targetNumber !== null && Number.isInteger(targetNumber) && targetNumber > 0 && <div><span>Target</span><strong>{targetNumber}</strong></div>}<p className={difference === 0 ? "correct" : difference !== null ? "adjust" : ""}>{status}</p></div>
      <div className="pill-toolbar"><button type="button" className="toolkit-button secondary" onClick={undo} disabled={!history.length || confirmed}>Undo</button><button type="button" className="toolkit-button secondary" onClick={() => setShowNumbers(value => !value)} aria-pressed={showNumbers}>Show numbers</button>{confirmed ? <button type="button" className="toolkit-button secondary" onClick={() => setConfirmed(false)}>Edit count</button> : <button type="button" className="toolkit-button" onClick={() => setConfirmed(true)} disabled={processing}>Confirm Count</button>}<button type="button" className="toolkit-button secondary" onClick={retake}>Retake</button><button type="button" className="toolkit-button secondary" onClick={reset}>Reset</button></div>
      {process.env.NODE_ENV !== "production" && diagnostics && <details className="pill-debug"><summary>Detector debug</summary><p>Raw components: {diagnostics.rawComponentCount} · Filtered: {diagnostics.filteredComponentCount} · Final: {diagnostics.finalDetectionCount}</p>{diagnostics.reasons.map(reason => <p key={reason}>{reason}</p>)}{diagnostics.images?.cleanedMask && <img src={diagnostics.images.cleanedMask} alt="Cleaned segmentation mask" />}</details>}
    </section>}
    {!imageUrl && <div className="pill-empty">Take or choose a photo to begin.</div>}
    <section className="pill-disclaimer"><strong>Clinical decision support only</strong><p>Review every marker before confirming. This tool counts visible objects and does not identify medication or verify tablet identity.</p></section>
  </main>;
}
