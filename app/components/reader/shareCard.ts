export type ImageTextScaleOptions = {
  arabicScale: number;
  translationScale: number;
};

export type ImageBackgroundId =
  | "emerald"
  | "midnight"
  | "sand"
  | "royal"
  | "rose"
  | "sage"
  | "olive"
  | "parchment";

export type ImageBackgroundOption = {
  id: ImageBackgroundId;
  label: string;
  swatch: string;
  base: [string, string, string];
  glow: string;
  glowMid: string;
  warmth: string;
  accent: string;
  accentSoft: string;
  gold: string;
  footerGlow: string;
  text: string;
  translation: string;
  brand: string;
  footerText: string;
  footerMuted: string;
  vignetteInner: string;
  vignetteMid: string;
  shadow: string;
};

export const IMAGE_BACKGROUNDS: ImageBackgroundOption[] = [
  {
    id: "emerald",
    label: "Emerald",
    swatch: "linear-gradient(135deg, #0a2f27 0%, #2e6a5f 100%)",
    base: ["#0a2f27", "#0c1b1e", "#060f12"],
    glow: "rgba(111, 212, 177, 0.30)",
    glowMid: "rgba(46, 106, 95, 0.12)",
    warmth: "rgba(216, 179, 106, 0.16)",
    accent: "rgba(111, 212, 177, 0.95)",
    accentSoft: "rgba(111, 212, 177, 0.35)",
    gold: "rgba(216, 179, 106, 0.75)",
    footerGlow: "rgba(111, 212, 177, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: "linear-gradient(135deg, #061224 0%, #1d3a66 100%)",
    base: ["#071323", "#0b1722", "#05080f"],
    glow: "rgba(92, 154, 255, 0.26)",
    glowMid: "rgba(58, 98, 158, 0.12)",
    warmth: "rgba(216, 179, 106, 0.11)",
    accent: "rgba(131, 181, 255, 0.95)",
    accentSoft: "rgba(131, 181, 255, 0.32)",
    gold: "rgba(216, 179, 106, 0.78)",
    footerGlow: "rgba(92, 154, 255, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "sand",
    label: "Sand",
    swatch: "linear-gradient(135deg, #3a2a18 0%, #8f6d3a 100%)",
    base: ["#2a2117", "#17130f", "#080706"],
    glow: "rgba(216, 179, 106, 0.24)",
    glowMid: "rgba(143, 109, 58, 0.12)",
    warmth: "rgba(111, 212, 177, 0.10)",
    accent: "rgba(216, 179, 106, 0.95)",
    accentSoft: "rgba(216, 179, 106, 0.30)",
    gold: "rgba(233, 201, 135, 0.82)",
    footerGlow: "rgba(216, 179, 106, 0.09)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "royal",
    label: "Royal",
    swatch: "linear-gradient(135deg, #201044 0%, #5e4bb6 100%)",
    base: ["#1b1238", "#111326", "#070711"],
    glow: "rgba(139, 116, 246, 0.24)",
    glowMid: "rgba(94, 75, 182, 0.12)",
    warmth: "rgba(216, 179, 106, 0.12)",
    accent: "rgba(164, 146, 255, 0.95)",
    accentSoft: "rgba(164, 146, 255, 0.30)",
    gold: "rgba(226, 195, 131, 0.80)",
    footerGlow: "rgba(139, 116, 246, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "linear-gradient(135deg, #3a111f 0%, #9d5264 100%)",
    base: ["#351421", "#1a1016", "#080607"],
    glow: "rgba(222, 120, 146, 0.22)",
    glowMid: "rgba(157, 82, 100, 0.12)",
    warmth: "rgba(216, 179, 106, 0.12)",
    accent: "rgba(235, 143, 165, 0.95)",
    accentSoft: "rgba(235, 143, 165, 0.30)",
    gold: "rgba(225, 190, 126, 0.80)",
    footerGlow: "rgba(222, 120, 146, 0.08)",
    text: "#ffffff",
    translation: "rgba(245, 250, 248, 0.96)",
    brand: "rgba(255, 255, 255, 0.72)",
    footerText: "rgba(255, 255, 255, 0.95)",
    footerMuted: "rgba(255, 255, 255, 0.45)",
    vignetteInner: "rgba(4, 10, 12, 0.55)",
    vignetteMid: "rgba(4, 10, 12, 0.35)",
    shadow: "rgba(0, 0, 0, 0.65)",
  },
  {
    id: "sage",
    label: "Charcoal",
    swatch: "#282a2a",
    base: ["#282a2a", "#282a2a", "#282a2a"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(232, 234, 229, 0.95)",
    accentSoft: "rgba(232, 234, 229, 0.16)",
    gold: "rgba(232, 234, 229, 0.76)",
    footerGlow: "rgba(255, 255, 255, 0.035)",
    text: "rgba(240, 242, 237, 0.97)",
    translation: "rgba(240, 242, 237, 0.88)",
    brand: "rgba(240, 242, 237, 0.64)",
    footerText: "rgba(240, 242, 237, 0.88)",
    footerMuted: "rgba(240, 242, 237, 0.50)",
    vignetteInner: "rgba(0, 0, 0, 0.05)",
    vignetteMid: "rgba(0, 0, 0, 0.025)",
    shadow: "rgba(0, 0, 0, 0.34)",
  },
  {
    id: "olive",
    label: "Deep olive",
    swatch: "#62674f",
    base: ["#62674f", "#62674f", "#62674f"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(243, 240, 219, 0.95)",
    accentSoft: "rgba(243, 240, 219, 0.18)",
    gold: "rgba(248, 240, 204, 0.82)",
    footerGlow: "rgba(255, 255, 255, 0.03)",
    text: "rgba(250, 248, 235, 0.98)",
    translation: "rgba(250, 248, 235, 0.92)",
    brand: "rgba(250, 248, 235, 0.72)",
    footerText: "rgba(250, 248, 235, 0.95)",
    footerMuted: "rgba(250, 248, 235, 0.56)",
    vignetteInner: "rgba(0, 0, 0, 0.10)",
    vignetteMid: "rgba(0, 0, 0, 0.05)",
    shadow: "rgba(43, 46, 35, 0.40)",
  },
  {
    id: "parchment",
    label: "Parchment",
    swatch: "#efede4",
    base: ["#efede4", "#efede4", "#efede4"],
    glow: "rgba(0, 0, 0, 0)",
    glowMid: "rgba(0, 0, 0, 0)",
    warmth: "rgba(0, 0, 0, 0)",
    accent: "rgba(36, 36, 31, 0.95)",
    accentSoft: "rgba(36, 36, 31, 0.10)",
    gold: "rgba(36, 36, 31, 0.68)",
    footerGlow: "rgba(36, 36, 31, 0.025)",
    text: "rgba(32, 32, 28, 0.96)",
    translation: "rgba(32, 32, 28, 0.86)",
    brand: "rgba(32, 32, 28, 0.68)",
    footerText: "rgba(32, 32, 28, 0.9)",
    footerMuted: "rgba(32, 32, 28, 0.52)",
    vignetteInner: "rgba(255, 255, 255, 0)",
    vignetteMid: "rgba(255, 255, 255, 0)",
    shadow: "rgba(80, 76, 64, 0.16)",
  },
];

export const DEFAULT_IMAGE_BACKGROUND: ImageBackgroundId = "emerald";

export function getImageBackground(backgroundId: ImageBackgroundId): ImageBackgroundOption {
  return IMAGE_BACKGROUNDS.find((background) => background.id === backgroundId) || IMAGE_BACKGROUNDS[0];
}

/**
 * Emerald template — 4:5 portrait (1080×1350), Spotify-style.
 * Full-bleed emerald gradient with radial colour blobs, big Arabic,
 * small translation, bold footer bar with surah + ayah number.
 * Pure client-side canvas — no server cost.
 */
export function generateAyahCard(
  arabic: string,
  translation: string,
  surahNameArabic: string,
  surahNameEnglish: string,
  surahNumber: number,
  ayahNumber: number,
  textScale: ImageTextScaleOptions = { arabicScale: 1, translationScale: 1 },
  backgroundId: ImageBackgroundId = DEFAULT_IMAGE_BACKGROUND,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    const width = 1080;
    const height = 1350; // 4:5 post aspect ratio
    canvas.width = width;
    canvas.height = height;

    const padX = 80;
    const background = getImageBackground(backgroundId);

    // --- Layer 1: base dark gradient ---
    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, background.base[0]);
    base.addColorStop(0.55, background.base[1]);
    base.addColorStop(1, background.base[2]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 2: mint radial blob, top-right (toned down) ---
    const blobA = ctx.createRadialGradient(
      width * 0.88, height * 0.08, 0,
      width * 0.88, height * 0.08, width * 0.7,
    );
    blobA.addColorStop(0, background.glow);
    blobA.addColorStop(0.45, background.glowMid);
    blobA.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = blobA;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 3: warm gold blob, pushed further into the corner and
    //    dimmed so it doesn't bleed into the translation area. ---
    const blobB = ctx.createRadialGradient(
      width * -0.05, height * 1.05, 0,
      width * -0.05, height * 1.05, width * 0.55,
    );
    blobB.addColorStop(0, background.warmth);
    blobB.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = blobB;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 3b: content-area vignette — a soft dark wash centered
    //    where the text lives, so both Arabic and English read on a
    //    consistent darker background regardless of blob bleed. ---
    const vignette = ctx.createRadialGradient(
      width * 0.5, height * 0.55, width * 0.15,
      width * 0.5, height * 0.55, width * 0.75,
    );
    vignette.addColorStop(0, background.vignetteInner);
    vignette.addColorStop(0.6, background.vignetteMid);
    vignette.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // --- Layer 4: subtle noise via random tiny rects (very cheap) ---
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = background.text;
    for (let i = 0; i < 600; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    // --- Brand lockup (top-left) ---
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.fillStyle = background.brand;
    ctx.font = `700 22px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("OPENFURQAN", padX, 100);

    // accent dot after wordmark
    ctx.beginPath();
    ctx.arc(padX + 176, 93, 4, 0, Math.PI * 2);
    ctx.fillStyle = background.accent;
    ctx.fill();

    // --- Surah name in Arabic (top-right, small, gold) ---
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.fillStyle = background.gold;
    ctx.font = `28px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    ctx.fillText(surahNameArabic, width - padX, 103);

    // --- Prepare Arabic text block ---
    const arabicLen = arabic.length;
    const baseArabicFontSize =
      arabicLen > 260 ? 46 :
      arabicLen > 180 ? 54 :
      arabicLen > 120 ? 64 :
      arabicLen > 70  ? 76 : 88;
    const arabicFontSize = Math.round(baseArabicFontSize * textScale.arabicScale);
    const arabicLineHeight = arabicFontSize * 1.7;

    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    const arabicLines = wrapText(ctx, arabic, width - padX * 2);

    // --- Prepare translation text ---
    const transLen = translation.length;
    const baseTransFontSize =
      transLen > 320 ? 24 :
      transLen > 200 ? 28 :
      transLen > 100 ? 32 : 36;
    const transFontSize = Math.round(baseTransFontSize * textScale.translationScale);
    const transLineHeight = transFontSize * 1.55;

    ctx.font = `400 ${transFontSize}px -apple-system, "Segoe UI", sans-serif`;
    const translationLines = wrapText(ctx, translation, width - padX * 2);

    // --- Compute vertical placement so content is balanced ---
    const topGuard = 160; // below brand row
    const bottomGuard = 180; // above footer bar
    const gapArabicTrans = 56;

    const arabicBlockH = arabicLines.length * arabicLineHeight;
    const transBlockH = translationLines.length * transLineHeight;
    const totalH = arabicBlockH + gapArabicTrans + transBlockH;
    const avail = height - topGuard - bottomGuard;
    const blockTop = topGuard + Math.max(0, (avail - totalH) / 2);

    // --- Render Arabic with subtle glow ---
    ctx.fillStyle = background.text;
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.font = `${arabicFontSize}px "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`;
    ctx.shadowColor = background.accentSoft;
    ctx.shadowBlur = 28;
    arabicLines.forEach((line, i) => {
      const y = blockTop + arabicFontSize + i * arabicLineHeight;
      ctx.fillText(line, width / 2, y);
    });
    ctx.shadowBlur = 0;

    // --- Render translation (crisper + soft shadow for readability
    //     over any blob variations) ---
    ctx.fillStyle = background.translation;
    ctx.direction = "ltr";
    ctx.textAlign = "center";
    ctx.font = `400 ${transFontSize}px -apple-system, "Segoe UI", sans-serif`;
    ctx.shadowColor = background.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    const transStartY = blockTop + arabicBlockH + gapArabicTrans + transFontSize;
    translationLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, transStartY + i * transLineHeight);
    });
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // --- Footer ---
    // Two-column citation footer. Arabic surah name is already shown at the top.
    const barH = 150;
    const barY = height - barH;

    // subtle background tint so the footer has presence without a hard bar
    const barGrad = ctx.createLinearGradient(0, barY, 0, height);
    barGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    barGrad.addColorStop(1, background.footerGlow);
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, barY, width, barH);

    // hairline divider at the top of the footer
    ctx.fillStyle = background.gold.replace(/0\.\d+\)$/, "0.28)");
    ctx.fillRect(padX, barY, width - padX * 2, 1);

    // --- Left column ---
    const smallCapsLabel = `SŪRAT ${surahNameEnglish.toUpperCase()} · ${surahNumber}:${ayahNumber}`;
    ctx.fillStyle = background.footerText;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.font = `700 26px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText(smallCapsLabel, padX, barY + 72);

    // --- Right column ---
    ctx.textAlign = "right";
    ctx.direction = "ltr";
    ctx.fillStyle = background.footerText;
    ctx.globalAlpha = 0.72;
    ctx.font = `600 21px -apple-system, "Segoe UI", sans-serif`;
    ctx.fillText("openfurqan.com", width - padX, barY + 72);
    ctx.globalAlpha = 1;

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      },
      "image/png",
      1,
    );
  });
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

