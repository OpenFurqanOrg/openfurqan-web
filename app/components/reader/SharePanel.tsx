"use client";

import { SOCIAL_LINKS } from "./ShareTargets";
import { DEFAULT_IMAGE_BACKGROUND, generateAyahCard, IMAGE_BACKGROUNDS, type ImageBackgroundId } from "./shareCard";

import { useCallback, useEffect, useRef, useState } from "react";
import { SURAH_BY_NUMBER } from "../../data/surahs";
import type { Ayah } from "../../lib/types";
import { normalizeQuranDisplayArabic } from "../../lib/utils";

type SharePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  ayah: Ayah | null;
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  selectedTranslation: string;
};

export default function SharePanel({
  isOpen,
  onClose,
  ayah,
  surahNumber,
  surahName,
  surahNameArabic,
  selectedTranslation,
}: SharePanelProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [imageArabicScale, setImageArabicScale] = useState(100);
  const [imageTranslationScale, setImageTranslationScale] = useState(100);
  const [selectedImageBackground, setSelectedImageBackground] = useState<ImageBackgroundId>(DEFAULT_IMAGE_BACKGROUND);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewRenderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPreviewRequestRef = useRef(0);

  // Close preview on Escape (takes precedence over closing the main panel)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewBlob(null);
      } else {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, previewUrl]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Clean up any preview URL on unmount / when panel closes
  useEffect(() => {
    if (isOpen) return;
    latestPreviewRequestRef.current += 1;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
      previewRenderTimerRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setPreviewBlob(null);
    }
    setImageArabicScale(100);
    setImageTranslationScale(100);
    setSelectedImageBackground(DEFAULT_IMAGE_BACKGROUND);
  }, [isOpen, previewUrl]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  if (!isOpen || !ayah) return null;

  const arabic = normalizeQuranDisplayArabic(ayah.arabic || "");
  const translationText = ayah.translations?.[selectedTranslation]?.text || "";
  const reference = `${surahName} ${surahNumber}:${ayah.number}`;
  const shareText = `${arabic}\n\n"${translationText}"\n\n— ${reference}\n\nopenfurqan.com`;

  const ayahUrl = (() => {
    const base = typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.origin
      : "https://openfurqan.com";
    const slug = SURAH_BY_NUMBER.get(surahNumber)?.slug || String(surahNumber);
    return `${base}/surah/${slug}/${ayah.number}`;
  })();

  const handleCopyText = async () => {
    const text = `${arabic}\n\n"${translationText}"\n\n— ${reference}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("Copied to clipboard");
      setTimeout(onClose, 800);
    }
  };

  const handleSocialShare = (id: string) => {
    const social = SOCIAL_LINKS.find((s) => s.id === id);
    if (!social) return;
    const url = social.getUrl(shareText, ayahUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      showToast("Share not supported on this device");
      return;
    }
    try {
      await navigator.share({ title: reference, text: shareText, url: ayahUrl });
    } catch {
      // User cancelled — do nothing
    }
  };

  const renderPreviewImage = async (
    arabicScalePercent = imageArabicScale,
    translationScalePercent = imageTranslationScale,
    backgroundId = selectedImageBackground,
  ) => {
    const requestId = latestPreviewRequestRef.current + 1;
    latestPreviewRequestRef.current = requestId;

    await document.fonts.ready;
    const blob = await generateAyahCard(
      arabic,
      translationText,
      surahNameArabic,
      surahName,
      surahNumber,
      ayah.number,
      {
        arabicScale: arabicScalePercent / 100,
        translationScale: translationScalePercent / 100,
      },
      backgroundId,
    );
    const url = URL.createObjectURL(blob);

    if (requestId !== latestPreviewRequestRef.current) {
      URL.revokeObjectURL(url);
      return;
    }

    setPreviewBlob(blob);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return url;
    });
  };

  const schedulePreviewRender = (
    arabicScalePercent: number,
    translationScalePercent: number,
    backgroundId = selectedImageBackground,
  ) => {
    if (!previewUrl) return;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
    }
    previewRenderTimerRef.current = setTimeout(() => {
      previewRenderTimerRef.current = null;
      void renderPreviewImage(arabicScalePercent, translationScalePercent, backgroundId).catch(() => {
        showToast("Failed to update image");
      });
    }, 180);
  };

  const handleShareImage = async () => {
    setGeneratingImage(true);
    try {
      await renderPreviewImage(imageArabicScale, imageTranslationScale, selectedImageBackground);
    } catch {
      showToast("Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  const closePreview = () => {
    latestPreviewRequestRef.current += 1;
    if (previewRenderTimerRef.current) {
      clearTimeout(previewRenderTimerRef.current);
      previewRenderTimerRef.current = null;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const handleArabicScaleChange = (value: string) => {
    const nextScale = Number(value);
    setImageArabicScale(nextScale);
    schedulePreviewRender(nextScale, imageTranslationScale, selectedImageBackground);
  };

  const handleTranslationScaleChange = (value: string) => {
    const nextScale = Number(value);
    setImageTranslationScale(nextScale);
    schedulePreviewRender(imageArabicScale, nextScale, selectedImageBackground);
  };

  const handleResetImageScales = () => {
    setImageArabicScale(100);
    setImageTranslationScale(100);
    schedulePreviewRender(100, 100, selectedImageBackground);
  };

  const handleImageBackgroundChange = (backgroundId: ImageBackgroundId) => {
    setSelectedImageBackground(backgroundId);
    schedulePreviewRender(imageArabicScale, imageTranslationScale, backgroundId);
  };

  const getPreviewSliderStyle = (value: number) => ({
    ["--share-slider-progress" as string]: `${((value - 80) / 40) * 100}%`,
  });

  const handleSavePreview = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${reference.replace(/[^a-zA-Z0-9]+/g, "-")}.png`;
    a.click();
    showToast("Image saved");
  };

  const handleSharePreview = async () => {
    if (!previewBlob) return;
    if (!navigator.share || !navigator.canShare) {
      // No native share — fall back to save.
      handleSavePreview();
      return;
    }
    try {
      const file = new File(
        [previewBlob],
        `${reference.replace(/[^a-zA-Z0-9]+/g, "-")}.png`,
        { type: "image/png" },
      );
      const shareData = { files: [file], title: reference };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        handleSavePreview();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      showToast("Share failed");
    }
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="share-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Share ayah"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="share-handle" />

        {/* Ayah reference header */}
        <div className="share-header">
          <span className="share-reference">{reference}</span>
          <button className="share-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social icons row */}
        <div className="share-socials">
          {SOCIAL_LINKS.map((social) => (
            <button
              key={social.id}
              className="share-social-btn"
              onClick={() => handleSocialShare(social.id)}
              aria-label={`Share on ${social.label}`}
              title={social.label}
            >
              <span className="share-social-icon" style={{ background: social.color }}>
                {social.icon}
              </span>
              <span className="share-social-label">{social.label}</span>
            </button>
          ))}
          <button
            className="share-social-btn"
            onClick={handleNativeShare}
            aria-label="More sharing options"
            title="More"
          >
            <span className="share-social-icon share-social-more">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </span>
            <span className="share-social-label">More</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="share-actions">
          <button className="share-action-btn" onClick={handleCopyText}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            <span>Copy Text</span>
          </button>
          <button
            className="share-action-btn share-action-image"
            onClick={handleShareImage}
            disabled={generatingImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>{generatingImage ? "Generating..." : "Share as Image"}</span>
          </button>
        </div>

        {/* Toast */}
        {toast && <span className="share-toast">{toast}</span>}
      </div>

      {/* Preview modal — shows the generated image so the user can review
          it before saving or sharing. Click overlay / Escape closes it
          (without closing the main share panel underneath). */}
      {previewUrl && (
        <div
          className="share-preview-overlay"
          onClick={(e) => {
            e.stopPropagation();
            closePreview();
          }}
        >
          <div
            className="share-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-preview-topbar">
              <div className="share-preview-topbar-left">
                <span className="share-preview-title">Preview</span>
                <div className="share-preview-palettes" aria-label="Image background color">
                  {IMAGE_BACKGROUNDS.map((background) => (
                    <button
                      key={background.id}
                      type="button"
                      className={`share-preview-palette${selectedImageBackground === background.id ? " active" : ""}`}
                      style={{ ["--share-palette" as string]: background.swatch }}
                      onClick={() => handleImageBackgroundChange(background.id)}
                      aria-label={`${background.label} background`}
                      aria-pressed={selectedImageBackground === background.id}
                      title={background.label}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="share-preview-close"
                onClick={closePreview}
                aria-label="Close preview"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="share-preview-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Ayah card preview"
                className="share-preview-image"
              />
            </div>

            <div className="share-preview-controls">
              <div className="share-preview-controls-header">
                <span>Text size</span>
                <button type="button" onClick={handleResetImageScales}>
                  Reset
                </button>
              </div>
              <label className="share-preview-control">
                <span className="share-preview-control-label">
                  <span>Arabic</span>
                  <span>{imageArabicScale}%</span>
                </span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  step="5"
                  value={imageArabicScale}
                  style={getPreviewSliderStyle(imageArabicScale)}
                  onChange={(event) => handleArabicScaleChange(event.target.value)}
                  aria-label="Arabic text size"
                />
              </label>
              <label className="share-preview-control">
                <span className="share-preview-control-label">
                  <span>English</span>
                  <span>{imageTranslationScale}%</span>
                </span>
                <input
                  type="range"
                  min="80"
                  max="120"
                  step="5"
                  value={imageTranslationScale}
                  style={getPreviewSliderStyle(imageTranslationScale)}
                  onChange={(event) => handleTranslationScaleChange(event.target.value)}
                  aria-label="English text size"
                />
              </label>
            </div>

            <div className="share-preview-actions">
              <button
                type="button"
                className="share-preview-btn share-preview-btn--ghost"
                onClick={handleSavePreview}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save</span>
              </button>
              <button
                type="button"
                className="share-preview-btn share-preview-btn--primary"
                onClick={handleSharePreview}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
