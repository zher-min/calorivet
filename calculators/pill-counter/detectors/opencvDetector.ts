/* OpenCV.js has no bundled TypeScript declarations; the untyped boundary is isolated here. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PILL_DETECTION_CONFIG as C } from "../detectorConfig";
import type { Detection, DetectionDiagnostics, DetectorResult, PillDetector } from "../types";
import { loadOpenCv } from "./opencvLoader";

export const opencvDetector: PillDetector = {
  async detect(canvas, options = {}) {
    const cv = await loadOpenCv();
    const src = cv.imread(canvas); let lab: any; let gray: any; let blur: any; let mask: any; let local: any; let contours: any; let hierarchy: any; let kernel: any; let borderMask: any; let similar: any; let lower: any; let upper: any;
    const detections: Detection[] = []; let rawCount = 0; let filteredCount = 0; const reasons: string[] = [];
    const debugImages: Record<string, string> = {};
    try {
      lab = new cv.Mat(); gray = new cv.Mat(); blur = new cv.Mat(); local = new cv.Mat();
      cv.cvtColor(src, lab, cv.COLOR_RGBA2LAB); cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); cv.GaussianBlur(gray, blur, new cv.Size(C.gaussianKernelSize, C.gaussianKernelSize), 0);
      const border = Math.max(1, Math.floor(Math.min(src.rows, src.cols) * C.borderSamplePercent)); borderMask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
      cv.rectangle(borderMask, new cv.Point(0, 0), new cv.Point(src.cols, border), new cv.Scalar(255), -1); cv.rectangle(borderMask, new cv.Point(0, src.rows - border), new cv.Point(src.cols, src.rows), new cv.Scalar(255), -1); cv.rectangle(borderMask, new cv.Point(0, 0), new cv.Point(border, src.rows), new cv.Scalar(255), -1); cv.rectangle(borderMask, new cv.Point(src.cols - border, 0), new cv.Point(src.cols, src.rows), new cv.Scalar(255), -1);
      const background = cv.mean(lab, borderMask); const threshold = Math.max(C.minBackgroundDistanceThreshold, Math.min(C.maxBackgroundDistanceThreshold, C.minBackgroundDistanceThreshold + 6));
      lower = new cv.Mat(src.rows, src.cols, lab.type(), new cv.Scalar(Math.max(0, background[0] - threshold), Math.max(0, background[1] - threshold), Math.max(0, background[2] - threshold), 0)); upper = new cv.Mat(src.rows, src.cols, lab.type(), new cv.Scalar(Math.min(255, background[0] + threshold), Math.min(255, background[1] + threshold), Math.min(255, background[2] + threshold), 255)); similar = new cv.Mat(); mask = new cv.Mat(); cv.inRange(lab, lower, upper, similar); cv.bitwise_not(similar, mask);
      cv.adaptiveThreshold(blur, local, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, C.adaptiveBlockSize, C.adaptiveConstant); cv.bitwise_or(mask, local, mask);
      kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(C.morphologyKernelSize, C.morphologyKernelSize)); cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), C.morphologyOpenIterations); cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), C.morphologyCloseIterations);
      if (options.debug) { const debugCanvas = document.createElement("canvas"); cv.imshow(debugCanvas, mask); debugImages.cleanedMask = debugCanvas.toDataURL("image/png"); }
      contours = new cv.MatVector(); hierarchy = new cv.Mat(); cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE); rawCount = contours.size(); const imageArea = src.rows * src.cols; const areas: number[] = [];
      for (let i = 0; i < contours.size(); i++) { const contour = contours.get(i); const area = cv.contourArea(contour); const rect = cv.boundingRect(contour); const aspect = rect.width / Math.max(1, rect.height); const perimeter = cv.arcLength(contour, true); const circularity = perimeter ? (4 * Math.PI * area) / (perimeter * perimeter) : 0; const hull = new cv.Mat(); cv.convexHull(contour, hull); const hullArea = cv.contourArea(hull); const solidity = hullArea ? area / hullArea : 0; const touchesBorder = rect.x <= src.cols * C.borderExclusionPercent || rect.y <= src.rows * C.borderExclusionPercent || rect.x + rect.width >= src.cols * (1 - C.borderExclusionPercent) || rect.y + rect.height >= src.rows * (1 - C.borderExclusionPercent); const valid = area >= imageArea * C.minRelativeArea && area <= imageArea * C.maxRelativeArea && aspect >= C.minAspectRatio && aspect <= C.maxAspectRatio && circularity >= C.minCircularity && solidity >= C.minSolidity && !touchesBorder; if (valid) { const moments = cv.moments(contour); if (moments.m00) { detections.push({ id: `pill-${detections.length + 1}`, x: moments.m10 / moments.m00 / src.cols, y: moments.m01 / moments.m00 / src.rows, source: "opencv", confidence: null }); areas.push(area); filteredCount++; } } hull.delete(); contour.delete(); }
      if (rawCount === 0) reasons.push("No foreground objects detected."); if (detections.length > C.maxExpectedDetections) reasons.push("Many small regions were detected; verify markers."); if (rawCount > Math.max(1, filteredCount) * C.excessiveNoiseRatio) reasons.push("Image contains substantial segmentation noise.");
      const diagnostics: DetectionDiagnostics = { rawComponentCount: rawCount, filteredComponentCount: filteredCount, finalDetectionCount: detections.length, suspicious: reasons.length > 0, reasons, images: options.debug ? debugImages : undefined };
      return { detections, diagnostics } satisfies DetectorResult;
    } finally { src.delete(); lab?.delete(); gray?.delete(); blur?.delete(); mask?.delete(); local?.delete(); contours?.delete(); hierarchy?.delete(); kernel?.delete(); borderMask?.delete(); similar?.delete(); lower?.delete(); upper?.delete(); }
  },
};
