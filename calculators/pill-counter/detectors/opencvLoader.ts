/* OpenCV.js has no bundled TypeScript declarations; the untyped boundary is isolated here. */
/* eslint-disable @typescript-eslint/no-explicit-any */
let runtimePromise: Promise<any> | null = null;

export function loadOpenCv(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("OpenCV is browser-only."));
  if ((window as any).cv?.Mat) return Promise.resolve((window as any).cv);
  if (runtimePromise) return runtimePromise;
  runtimePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/opencv/opencv.js";
    script.async = true;
    script.onload = () => {
      const cv = (window as any).cv;
      if (!cv) return reject(new Error("OpenCV did not initialize."));
      if (cv.Mat) return resolve(cv);
      cv.onRuntimeInitialized = () => resolve(cv);
      window.setTimeout(() => reject(new Error("OpenCV initialization timed out.")), 20000);
    };
    script.onerror = () => reject(new Error("OpenCV could not be loaded."));
    document.head.appendChild(script);
  });
  return runtimePromise;
}
