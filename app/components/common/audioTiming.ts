import { getTimingPositionFix, isWordHighlightDisabled } from "../../lib/audioTimingSafety";
import type { ChapterWordTiming } from "../../lib/types";

export const QURAN_API_RECITER_BY_LOCAL_ID: Record<string, number> = {
  alafasy: 7,
  sudais: 3,
  shuraim: 10,
  shaatree: 4,
  hani: 5,
  abdulbasit: 2,
  husary: 6,
  minshawi: 8
};

export const LOCAL_TIMING_RECITER_IDS = new Set(["husary", "alafasy"]);

export const parseAyahFromVerseKey = (verseKey?: string): number | null => {
  if (!verseKey) return null;
  const [, ayahRaw] = verseKey.split(":");
  const ayah = Number.parseInt(ayahRaw || "", 10);
  return Number.isInteger(ayah) && ayah > 0 ? ayah : null;
};

export const normalizeAudioUrl = (audioUrl?: string): string | null => {
  if (!audioUrl) return null;
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  return `https://audio.qurancdn.com/${audioUrl.replace(/^\/+/, "")}`;
};

export const normalizeWordSegments = (segments?: unknown[]): ChapterWordTiming[] => {
  if (!Array.isArray(segments)) return [];

  return segments
    .map((segment) => {
      if (!Array.isArray(segment) || segment.length < 3) return null;
      const position = Number(segment[0]);
      const fromMs = Number(segment[1]);
      const toMs = Number(segment[2]);
      if (
        !Number.isInteger(position)
        || position < 1
        || !Number.isFinite(fromMs)
        || !Number.isFinite(toMs)
        || toMs < fromMs
      ) {
        return null;
      }
      return { position, fromMs, toMs };
    })
    .filter((segment): segment is ChapterWordTiming => segment !== null);
};

export const applyKnownTimingPositionFix = (
  reciterId: string,
  surahNumber: number,
  ayahNumber: number,
  words: ChapterWordTiming[]
) => {
  const expectedPositions = getTimingPositionFix(reciterId, surahNumber, ayahNumber);
  if (!expectedPositions || expectedPositions.length !== words.length) {
    return words;
  }

  return words.map((word, index) => ({
    ...word,
    position: expectedPositions[index] ?? word.position
  }));
};

export const normalizeStoredWordTimings = (
  reciterId: string,
  surahNumber: number,
  ayahNumber: number,
  words?: ChapterWordTiming[]
): ChapterWordTiming[] => {
  if (!Array.isArray(words)) return [];
  if (isWordHighlightDisabled(reciterId, surahNumber, ayahNumber)) {
    return [];
  }

  const normalized = words
    .map((word) => {
      const position = Number(word?.position);
      const fromMs = Number(word?.fromMs);
      const toMs = Number(word?.toMs);
      if (
        !Number.isInteger(position)
        || position < 1
        || !Number.isFinite(fromMs)
        || !Number.isFinite(toMs)
        || toMs < fromMs
      ) {
        return null;
      }
      return { position, fromMs, toMs };
    })
    .filter((word): word is ChapterWordTiming => word !== null);

  return applyKnownTimingPositionFix(reciterId, surahNumber, ayahNumber, normalized);
};

