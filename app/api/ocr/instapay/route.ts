import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractBestAmount(text: string): number | null {
    const lines = (text || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    // Matches:
    // - 30,000  / 27,600 / 1,234,567.89
    // - 200 / 5000 / 200.50
    const AMOUNT_REGEX =
        /\b(?:\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/;

    const toNumber = (s: string) => {
        const n = Number(s.replace(/,/g, ""));
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    const isPhoneLike = (s: string) => {
        const digits = s.replace(/[^\d]/g, "");
        // Egyptian mobile numbers: usually start with 01 and are 11 digits
        if (digits.length === 11 && digits.startsWith("01")) return true;
        // Very long numbers are usually references/accounts
        if (digits.length >= 9) return true;
        return false;
    };

    // 1) Highest priority: line containing EGP (amount is typically right next to it)
    for (const line of lines) {
        if (/EGP/i.test(line)) {
            const m = line.match(AMOUNT_REGEX);
            if (m && !isPhoneLike(m[0])) {
                const n = toNumber(m[0]);
                if (n !== null) return n;
            }
        }
    }

    // 2) Second priority: a line containing "Transfer Amount"
    for (const line of lines) {
        if (/transfer\s*amount/i.test(line)) {
            const m = line.match(AMOUNT_REGEX);
            if (m && !isPhoneLike(m[0])) {
                const n = toNumber(m[0]);
                if (n !== null) return n;
            }
        }
    }

    // 3) Fallback: scan all matches, remove phone/reference-like numbers, choose the best plausible
    const allMatches = lines.flatMap((l) => l.match(new RegExp(AMOUNT_REGEX.source, "g")) || []);

    const candidates = allMatches
        .filter((s) => !isPhoneLike(s))
        .map((s) => toNumber(s))
        .filter((n): n is number => n !== null)
        .filter((n) => n < 1_000_000_000); // extra safety

    if (!candidates.length) return null;

    // For Instapay, the transfer amount is usually among the larger remaining numbers.
    candidates.sort((a, b) => b - a);
    return candidates[0];
}


export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file");

        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Missing file" }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer()).toString("base64");

        const visionRes = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requests: [
                        {
                            image: { content: buf },
                            features: [{ type: "TEXT_DETECTION" }],
                        },
                    ],
                }),
            }
        );

        if (!visionRes.ok) {
            const err = await visionRes.text();
            return NextResponse.json({ error: err }, { status: 500 });
        }

        const json = await visionRes.json();

        const fullText =
            json?.responses?.[0]?.fullTextAnnotation?.text ||
            json?.responses?.[0]?.textAnnotations?.[0]?.description ||
            "";

        const amount = extractBestAmount(fullText);
        return NextResponse.json({ amount, rawText: fullText });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "Unknown error" },
            { status: 500 }
        );
    }
}
