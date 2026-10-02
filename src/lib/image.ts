export async function fileToImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export function drawScaled(img: HTMLImageElement, max: number, quality: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", quality);
}

/** Returns a compressed JPEG (base64 without prefix) for the API, a preview URL and a small thumbnail. */
export async function prepareImage(file: Blob) {
  const img = await fileToImage(file);
  const full = drawScaled(img, 1700, 0.85);
  const thumb = drawScaled(img, 260, 0.7);
  return { base64: full.split(",")[1], preview: full, thumb, mimeType: "image/jpeg" };
}

export async function urlToBlob(url: string) {
  const r = await fetch(url);
  return r.blob();
}
