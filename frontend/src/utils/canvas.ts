export function frameToBase64(video: HTMLVideoElement, maxW = 640) {
  const canvas = document.createElement("canvas");
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, maxW / w);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85); // "data:image/jpeg;base64,..."
}

export function dataUrlToBase64(dataUrl: string) {
  const [, base64] = dataUrl.split(",");
  return base64 || "";
}
