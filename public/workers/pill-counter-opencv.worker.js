/* Classic worker: OpenCV is loaded only inside this worker. */
let cvReady = null;
const load = () => {
  if (cvReady) return cvReady;
  cvReady = new Promise((resolve, reject) => {
    self.Module = { onRuntimeInitialized: () => resolve(self.cv) };
    try { importScripts('/vendor/opencv/opencv.js'); } catch (e) { reject(e); }
  });
  return cvReady;
};
self.onmessage = async (event) => {
  const m = event.data;
  if (!m || m.type !== 'detect') return;
  const id = m.requestId;
  try {
    self.postMessage({ type: 'loading', requestId: id });
    const cv = await load();
    self.postMessage({ type: 'processing', requestId: id });
    const C = m.config; const src = new cv.Mat(m.height, m.width, cv.CV_8UC4, new Uint8Array(m.pixelBuffer));
    let lab, gray, blur, mask, local, contours, hierarchy, kernel, borderMask, similar, lower, upper;
    const detections = []; let rawCount = 0; let filteredCount = 0; const reasons = [];
    try {
      lab = new cv.Mat(); gray = new cv.Mat(); blur = new cv.Mat(); local = new cv.Mat();
      cv.cvtColor(src, lab, cv.COLOR_RGBA2LAB); cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY); cv.GaussianBlur(gray, blur, new cv.Size(C.gaussianKernelSize, C.gaussianKernelSize), 0);
      const border = Math.max(1, Math.floor(Math.min(src.rows, src.cols) * C.borderSamplePercent)); borderMask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
      cv.rectangle(borderMask,new cv.Point(0,0),new cv.Point(src.cols,border),new cv.Scalar(255),-1); cv.rectangle(borderMask,new cv.Point(0,src.rows-border),new cv.Point(src.cols,src.rows),new cv.Scalar(255),-1); cv.rectangle(borderMask,new cv.Point(0,0),new cv.Point(border,src.rows),new cv.Scalar(255),-1); cv.rectangle(borderMask,new cv.Point(src.cols-border,0),new cv.Point(src.cols,src.rows),new cv.Scalar(255),-1);
      const bg = cv.mean(lab,borderMask); const t = Math.max(C.minBackgroundDistanceThreshold, Math.min(C.maxBackgroundDistanceThreshold, C.minBackgroundDistanceThreshold + 6));
      lower = new cv.Mat(src.rows,src.cols,lab.type(),new cv.Scalar(Math.max(0,bg[0]-t),Math.max(0,bg[1]-t),Math.max(0,bg[2]-t),0)); upper = new cv.Mat(src.rows,src.cols,lab.type(),new cv.Scalar(Math.min(255,bg[0]+t),Math.min(255,bg[1]+t),Math.min(255,bg[2]+t),255)); similar = new cv.Mat(); mask = new cv.Mat(); cv.inRange(lab,lower,upper,similar); cv.bitwise_not(similar,mask);
      cv.adaptiveThreshold(blur,local,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,C.adaptiveBlockSize,C.adaptiveConstant); cv.bitwise_or(mask,local,mask); kernel=cv.getStructuringElement(cv.MORPH_ELLIPSE,new cv.Size(C.morphologyKernelSize,C.morphologyKernelSize)); cv.morphologyEx(mask,mask,cv.MORPH_OPEN,kernel,new cv.Point(-1,-1),C.morphologyOpenIterations); cv.morphologyEx(mask,mask,cv.MORPH_CLOSE,kernel,new cv.Point(-1,-1),C.morphologyCloseIterations);
      contours=new cv.MatVector(); hierarchy=new cv.Mat(); cv.findContours(mask,contours,hierarchy,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE); rawCount=contours.size(); const imageArea=src.rows*src.cols;
      for(let i=0;i<contours.size();i++){const contour=contours.get(i);const area=cv.contourArea(contour);const rect=cv.boundingRect(contour);const aspect=rect.width/Math.max(1,rect.height);const perimeter=cv.arcLength(contour,true);const circularity=perimeter?(4*Math.PI*area)/(perimeter*perimeter):0;const hull=new cv.Mat();cv.convexHull(contour,hull);const hullArea=cv.contourArea(hull);const solidity=hullArea?area/hullArea:0;const touches=rect.x<=src.cols*C.borderExclusionPercent||rect.y<=src.rows*C.borderExclusionPercent||rect.x+rect.width>=src.cols*(1-C.borderExclusionPercent)||rect.y+rect.height>=src.rows*(1-C.borderExclusionPercent);const valid=area>=imageArea*C.minRelativeArea&&area<=imageArea*C.maxRelativeArea&&aspect>=C.minAspectRatio&&aspect<=C.maxAspectRatio&&circularity>=C.minCircularity&&solidity>=C.minSolidity&&!touches;if(valid){const mo=cv.moments(contour);if(mo.m00){detections.push({id:'pill-'+(detections.length+1),x:mo.m10/mo.m00/src.cols,y:mo.m01/mo.m00/src.rows,source:'opencv',confidence:null});filteredCount++;}}hull.delete();contour.delete();}
      if(rawCount===0) reasons.push('No foreground objects detected.'); if(detections.length>C.maxExpectedDetections) reasons.push('Many small regions were detected; verify markers.'); if(rawCount>Math.max(1,filteredCount)*C.excessiveNoiseRatio) reasons.push('Image contains substantial segmentation noise.');
      self.postMessage({type:'result',requestId:id,result:{detections,diagnostics:{rawComponentCount:rawCount,filteredComponentCount:filteredCount,finalDetectionCount:detections.length,suspicious:reasons.length>0,reasons}}});
    } finally { src.delete(); [lab,gray,blur,mask,local,contours,hierarchy,kernel,borderMask,similar,lower,upper].forEach(x=>x&&x.delete()); }
  } catch (error) { self.postMessage({type:'error',requestId:id,error:error instanceof Error?error.message:'Detection failed.'}); }
};
