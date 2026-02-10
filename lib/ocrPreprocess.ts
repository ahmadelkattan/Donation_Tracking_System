// lib/ocrPreprocess.ts
"use client";

/**
 * Converts an image File into a preprocessed Blob URL suitable for fast OCR:
 * - Crops to center region where amount is likely to be
 * - Resizes to manageable dimensions
 * - Grayscale + contrast boost
 */
export async function preprocessForInstapayOCR(
    file: File,
    opts?: {
        maxWidth?: number;      // output width cap
        maxHeight?: number;     // output height cap
        cropMode?: "center" | "smart";
    }
): Promise<{ blob: Blob; width: number; height: number }> {
    const maxWidth = opts?.maxWidth ?? 1100;
    const maxHeight = opts?.maxHeight ?? 1100;
    const cropMode = opts?.cropMode ?? "smart";

    const img = await loadImageFromFile(file);

    // ---- 1) Crop: focus on area where the amount appears ----
    // Instapay examples: amount is in upper-middle area (after success text)
    // We'll crop a region that typically contains the large number + EGP.
    const { sx, sy, sw, sh } = getCropRect(img.width, img.height, cropMode);

    // ---- 2) Resize: keep OCR fast ----
    const { dw, dh } = fitWithin(sw, sh, maxWidth, maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // draw crop -> resized canvas
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

    // ---- 3) Preprocess pixels: grayscale + contrast ----
    const imageData = ctx.getImageData(0, 0, dw, dh);
    enhanceForOCR(imageData);
    ctx.putImageData(imageData, 0, 0);

    // Export as JPEG (smaller + fast)
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    return { blob, width: dw, height: dh };
}

function getCropRect(w: number, h: number, cropMode: "center" | "smart") {
    if (cropMode === "center") {
        // Simple crop: centered band
        const sx = Math.floor(w * 0.10);
        const sy = Math.floor(h * 0.18);
        const sw = Math.floor(w * 0.80);
        const sh = Math.floor(h * 0.55);
        return { sx, sy, sw, sh };
    }

    // "smart" crop tuned for your samples:
    // Keep most width, take upper-middle region.
    // This usually includes the amount + EGP, and excludes bottom noise.
    const sx = Math.floor(w * 0.06);
    const sy = Math.floor(h * 0.15);
    const sw = Math.floor(w * 0.88);
    const sh = Math.floor(h * 0.60);
    return { sx, sy, sw, sh };
}

function fitWithin(sw: number, sh: number, maxW: number, maxH: number) {
    const scale = Math.min(maxW / sw, maxH / sh, 1); // never upscale
    const dw = Math.max(1, Math.floor(sw * scale));
    const dh = Math.max(1, Math.floor(sh * scale));
    return { dw, dh };
}

function enhanceForOCR(img: ImageData) {
    const d = img.data;

    // Grayscale + contrast stretch
    // Contrast factor: >1 increases contrast
    const contrast = 1.25; // 1.15–1.35 is usually safe

    for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // luminance
        let y = 0.299 * r + 0.587 * g + 0.114 * b;

        // contrast adjustment around midpoint 128
        y = (y - 128) * contrast + 128;

        // clamp
        y = Math.max(0, Math.min(255, y));

        d[i] = d[i + 1] = d[i + 2] = y;
        // keep alpha
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            type,
            quality
        );
    });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };
        img.src = url;
    });
}
