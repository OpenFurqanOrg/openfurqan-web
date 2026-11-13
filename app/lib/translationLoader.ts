import "server-only";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { gunzipSync } from "node:zlib";
import { dataPath } from "./dataPath";

// Keep recent chapters in memory, including repeat requests in Compare.
const CHAPTER_CACHE_LIMIT = 340;
const chapters = new Map<string, Map<number, string> | null>();
let selectChapter: StatementSync | undefined;

const plainTranslationText = (text: string) =>
  text
    .replace(/<sup\b[^>]*\bfoot_note\s*=[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<\/(?:p|div)>\s*(?=<(?:p|div)\b)/gi, "\n")
    .replace(/<\/?(?:a|b|div|i|p|span|sup)\b[^>]*>/gi, "")
    .trim();

export const getTranslation = (translationId: string, surahNumber: number): Map<number, string> | null => {
  const key = `${translationId}:${surahNumber}`;
  const cached = chapters.get(key);
  if (cached !== undefined) {
    chapters.delete(key);
    chapters.set(key, cached);
    return cached;
  }

  if (!selectChapter) {
    const db = new DatabaseSync(dataPath("translations.sqlite"), { readOnly: true });
    selectChapter = db.prepare("SELECT verses FROM chapter WHERE surah = ? AND edition = ?");
  }
  const row = selectChapter.get(surahNumber, translationId) as { verses: Uint8Array } | undefined;
  const texts = row ? JSON.parse(gunzipSync(row.verses).toString("utf8")) as string[] : null;
  const verses = texts && new Map(texts.map((text, index) => [index + 1, plainTranslationText(text)]));
  if (chapters.size >= CHAPTER_CACHE_LIMIT) {
    const oldest = chapters.keys().next().value;
    if (oldest !== undefined) chapters.delete(oldest);
  }
  chapters.set(key, verses);
  return verses;
};

export const getAyahTranslation = (translationId: string, surahNumber: number, ayahNumber: number) =>
  getTranslation(translationId, surahNumber)?.get(ayahNumber) ?? null;
