export const PILL_DETECTION_CONFIG = {
  maxProcessingDimension: 1280, borderSamplePercent: 0.06,
  backgroundMadMultiplier: 2.5, minBackgroundDistanceThreshold: 12, maxBackgroundDistanceThreshold: 35,
  gaussianKernelSize: 3, adaptiveBlockSize: 31, adaptiveConstant: 5, morphologyKernelSize: 3,
  morphologyOpenIterations: 1, morphologyCloseIterations: 1, minRelativeArea: 0.00004, maxRelativeArea: 0.08,
  minAspectRatio: 0.15, maxAspectRatio: 6.5, minCircularity: 0.08, minSolidity: 0.45,
  borderExclusionPercent: 0.005, mergedObjectAreaMultiplier: 1.65, watershedPeakThreshold: 0.45,
  maxExpectedDetections: 300, excessiveNoiseRatio: 8,
} as const;
