export type DetectionSource = "opencv" | "manual";
export interface Detection { id: string; x: number; y: number; source: DetectionSource; confidence: number | null; }
export interface DetectionDiagnostics { rawComponentCount: number; filteredComponentCount: number; finalDetectionCount: number; suspicious: boolean; reasons: string[]; images?: Record<string, string>; }
export interface DetectorResult { detections: Detection[]; diagnostics?: DetectionDiagnostics; }
export interface PillDetector { detect(image: HTMLCanvasElement, options?: { debug?: boolean }): Promise<DetectorResult>; }
