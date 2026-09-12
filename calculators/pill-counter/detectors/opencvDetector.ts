/* OpenCV.js has no bundled TypeScript declarations; the untyped boundary is isolated here. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PILL_DETECTION_CONFIG as C } from "../detectorConfig";
import type { Detection, DetectionDiagnostics, DetectorResult, PillDetector } from "../types";
import { loadOpenCv } from "./opencvLoader";

const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; };

export const opencvDetector: PillDetector = {
  async detect(canvas, options = {}) {
    const cv = await loadOpenCv();
    const src = cv.imread(canvas); let lab: any; let gray: any; let blur: any; let mask: any; let local: any; let contours: any; let hierarchy: any; let kernel: any;
    const detections: Detection[] = []; let rawCount = 0; let filteredCount = 0; const reasons: string[] = [];
    const debugImages: Record<string, string> = {};
    try {
      lab = new cv.Mat(); gray = new cv.Mat(); blur = new cv.Mat(); mask = new cv.Mat(); local = new cv.Mat();
      cv.cvtColor(src, lab, cv.COLOR_RGBA2LAB); cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); cv.GaussianBlur(gray, blur, new cv.Size(C.gaussianKernelSize, C.gaussianKernelSize), 0);
      const border = Math.max(1, Math.floor(Math.min(src.rows, src.cols) * C.borderSamplePercent)); const pixels: number[] = [];
      for (let y = 0; y < src.rows; y += Math.max(1, Math.floor(src.rows / 80))) for (let x = 0; x < src.cols; x += Math.max(1, Math.floor(src.cols / 80))) if (x < border || y < border || x >= src.cols - border || y >= src.rows - border) pixels.push(lab.ucharPtr(y, x)[0]);
      const backgroundL = median(pixels); const distances = pixels.map(value => Math.abs(value - backgroundL)); const threshold = Math.max(C.minBackgroundDistanceThreshold, Math.min(C.maxBackgroundDistanceThreshold, median(distances) * 2.5 + 8));
      mask.create(src.rows, src.cols, cv.CV_8UC1); for (let y = 0; y < src.rows; y++) for (let x = 0; x < src.cols; x++) mask.ucharPtr(y, x)[0] = Math.abs(lab.ucharPtr(y, x)[0] - backgroundL) > threshold ? 255 : 0;
      cv.adaptiveThreshold(blur, local, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, C.adaptiveBlockSize, C.adaptiveConstant); cv.bitwise_or(mask, local, mask);
      kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(C.morphologyKernelSize, C.morphologyKernelSize)); cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), C.morphologyOpenIterations); cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), C.morphologyCloseIterations);
      if (options.debug) { const debugCanvas = document.createElement("canvas"); cv.imshow(debugCanvas, mask); debugImages.cleanedMask = debugCanvas.toDataURL("image/png"); }
      contours = new cv.MatVector(); hierarchy = new cv.Mat(); cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE); rawCount = contours.size(); const imageArea = src.rows * src.cols; const areas: number[] = [];
      for (let i = 0; i < contours.size(); i++) { const contour = contours.get(i); const area = cv.contourArea(contour); const rect = cv.boundingRect(contour); const aspect = rect.width / Math.max(1, rect.height); const perimeter = cv.arcLength(contour, true); const circularity = perimeter ? (4 * Math.PI * area) / (perimeter * perimeter) : 0; const hull = new cv.Mat(); cv.convexHull(contour, hull); const hullArea = cv.contourArea(hull); const solidity = hullArea ? area / hullArea : 0; const touchesBorder = rect.x <= src.cols * C.borderExclusionPercent || rect.y <= src.rows * C.borderExclusionPercent || rect.x + rect.width >= src.cols * (1 - C.borderExclusionPercent) || rect.y + rect.height >= src.rows * (1 - C.borderExclusionPercent); const valid = area >= imageArea * C.minRelativeArea && area <= imageArea * C.maxRelativeArea && aspect >= C.minAspectRatio && aspect <= C.maxAspectRatio && circularity >= C.minCircularity && solidity >= C.minSolidity && !touchesBorder; if (valid) { const moments = cv.moments(contour); if (moments.m00) { detections.push({ id: `pill-${detections.length + 1}`, x: moments.m10 / moments.m00 / src.cols, y: moments.m01 / moments.m00 / src.rows, source: "opencv", confidence: null }); areas.push(area); filteredCount++; } } hull.delete(); contour.delete(); }
      if (rawCount === 0) reasons.push("No foreground objects detected."); if (detections.length > C.maxExpectedDetections) reasons.push("Many small regions were detected; verify markers."); if (rawCount > Math.max(1, filteredCount) * C.excessiveNoiseRatio) reasons.push("Image contains substantial segmentation noise.");
      const diagnostics: DetectionDiagnostics = { rawComponentCount: rawCount, filteredComponentCount: filteredCount, finalDetectionCount: detections.length, suspicious: reasons.length > 0, reasons, images: options.debug ? debugImages : undefined };
      return { detections, diagnostics } satisfies DetectorResult;
    } finally { src.delete(); lab?.delete(); gray?.delete(); blur?.delete(); mask?.delete(); local?.delete(); contours?.delete(); hierarchy?.delete(); kernel?.delete(); }
  },
};
