// lib/extractAmount.ts
"use client";

import { preprocessForInstapayOCR } from "./ocrPreprocess";

/**
 * NEW VERSION (recommended with Vercel):
 * - Keeps your preprocessing (crop/resize/contrast) because it helps OCR a lot
 * - Sends the preprocessed image to a server API route: POST /api/ocr/instapay (FormData)
 * - The server route calls Google Vision using GOOGLE_VISION_API_KEY (server-side)
 *
 * ✅ No tesseract.js in the browser
 * ✅ Works on Safari / mobile
 * ✅ Same function signature, so /add/instapay/page.tsx can remain unchanged
 */
export async function extractAmountFromImage(file: File): Promise<number | null> {
  // Preprocess: crop + resize + grayscale/contrast (keep this)
  const { blob } = await preprocessForInstapayOCR(file, {
    maxWidth: 1100,
    maxHeight: 1100,
    cropMode: "smart",
  });

  const formData = new FormData();
  formData.append("file", blob, file.name || "instapay.png");

  try {
    const res = await fetch("/api/ocr/instapay", {
      method: "POST",
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("OCR API failed:", json?.error || json);
      return null;
    }

    const amount = json?.amount;
    return typeof amount === "number" && Number.isFinite(amount) && amount > 0
        ? amount
        : null;
  } catch (e) {
    console.error("OCR error:", e);
    return null;
  }
}
