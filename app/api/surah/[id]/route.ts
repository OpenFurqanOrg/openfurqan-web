import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SURAHS } from "../../../data/surahs";
import { parseTranslationIds } from "../../../lib/translations";
import { getTranslation } from "../../../lib/translationLoader";
import { apiRateGuard } from "../../../lib/apiRateLimit";
import { readDataJson } from "../../../lib/dataPath";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
};

type ArabicVerse = {
  number: number;
  text: string;
  tajweed: string | null;
  page: number | null;
};

// The pinned build-time data preserves word-aligned Arabic, tajweed and page fields.
type LocalQuranEntry = {
  ar?: string;
  en?: string;
  tj?: string | null;
  pg?: number | null;
};
type LocalQuranData = Record<string, Record<string, LocalQuranEntry>>;
const QURAN_TEXT = readDataJson<LocalQuranData>("quran-text.json");

const getLocalArabicVerses = (surahNumber: number): ArabicVerse[] => {
  const surahData = QURAN_TEXT[String(surahNumber)];
  if (!surahData) return [];
  const verses: ArabicVerse[] = [];
  for (const [ayahKey, entry] of Object.entries(surahData)) {
    const number = Number(ayahKey);
    if (!Number.isFinite(number)) continue;
    verses.push({
      number,
      text: entry.ar || "",
      tajweed: entry.tj ?? null,
      page: entry.pg ?? null,
    });
  }
  verses.sort((a, b) => a.number - b.number);
  return verses;
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const blocked = await apiRateGuard(request, "api-surah");
  if (blocked) return blocked;

  const { id } = await Promise.resolve(params);
  const surahNumber = Number(id);

  if (!id || !Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: "Invalid surah id." }, { status: 400 });
  }

  try {
    const transliterationParam = String(
      request.nextUrl.searchParams.get("transliteration") || ""
    ).toLowerCase();
    const includeTransliteration = ["1", "true", "yes", "on"].includes(
      transliterationParam
    );

    const translationIds = parseTranslationIds(request.nextUrl.searchParams.get("translations"));

    // 1. Get surah metadata from local data
    const surahMeta = SURAHS.find((s) => s.number === surahNumber);
    if (!surahMeta) {
      return NextResponse.json({ error: "Surah not found." }, { status: 404 });
    }

    // 2. Load only the requested chapters.
    const translationResults = translationIds.map(id => ({
      id,
      verses: getTranslation(id, surahNumber)
    }));
    const transliterationByAyah = includeTransliteration
      ? getTranslation("en-transliteration", surahNumber)
      : null;

    // 3. Read Arabic + tajweed + page from verified build-time data.
    const arabicVerses = getLocalArabicVerses(surahNumber);
    const arabicByNumber = new Map<number, ArabicVerse>(
      arabicVerses.map((verse) => [verse.number, verse])
    );

    // 4. Merge Data
    const ayahs: Array<{
      number: number;
      arabic: string;
      arabicTajweed: string | null;
      transliteration?: string;
      pageNumber: number | null;
      translations: Record<string, { text: string }>;
    }> = [];

    const totalAyahs = surahMeta.ayahCount;

    for (let i = 1; i <= totalAyahs; i++) {
      const arabicEntry = arabicByNumber.get(i);
      const arabicText = arabicEntry?.text || "Arabic text unavailable";
      const arabicTajweed = arabicEntry?.tajweed || null;
      const pageNumber = arabicEntry?.page || null;

      const translations: Record<string, { text: string }> = {};
      for (const result of translationResults) {
        const text = result.verses?.get(i);
        if (text) {
          translations[result.id] = { text };
        }
      }

      ayahs.push({
        number: i,
        arabic: arabicText,
        arabicTajweed,
        transliteration: transliterationByAyah?.get(i) || undefined,
        pageNumber,
        translations
      });
    }

    return NextResponse.json(
      {
        surah: {
          number: surahMeta.number,
          name: surahMeta.arabicName,
          englishName: surahMeta.englishName,
          englishNameTranslation: surahMeta.translation,
          numberOfAyahs: surahMeta.ayahCount,
          revelationType: surahMeta.revelationType
        },
        ayahs,
        arabicScript: "uthmani",
        translationOrder: translationIds
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Unable to load Surah data." },
      { status: 502 }
    );
  }
}
