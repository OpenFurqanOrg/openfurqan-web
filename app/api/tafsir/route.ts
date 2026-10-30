import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";
import { isKnownTafsirEdition, isLocalTafsirEdition } from "../../lib/tafsirEditions";
import { cleanTafsirText } from "../../lib/tafsirText";
import { getAyahTranslation } from "../../lib/translationLoader";
import { readFile } from "node:fs/promises";
import { dataPath } from "../../lib/dataPath";

export const revalidate = 2592000;

type TafsirSurahResponse = {
  ayahs: Array<{ ayah: number; to?: number; text?: string }>;
};

const tafsirCache = new Map<string, Promise<TafsirSurahResponse>>();
const loadAyahText = async (edition: string, surah: number, ayah: number) => {
  const key = `${edition}/${surah}`;
  let pending = tafsirCache.get(key);
  if (!pending) {
    pending = readFile(dataPath("tafsir", edition, `${surah}.json`), "utf8")
      .then(raw => JSON.parse(raw) as TafsirSurahResponse)
      .catch(error => { tafsirCache.delete(key); throw error; });
    tafsirCache.set(key, pending);
  }
  const data = await pending;
  return data.ayahs.find(item => item.ayah <= ayah && (item.to ?? item.ayah) >= ayah)?.text ?? "";
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const edition = (url.searchParams.get("edition") || "").trim();
  const surah = Number(url.searchParams.get("surah"));
  const ayah = Number(url.searchParams.get("ayah"));

  if (!edition || !isKnownTafsirEdition(edition)) {
    return NextResponse.json({ error: "Invalid tafsir edition." }, { status: 400 });
  }
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: "Invalid surah number." }, { status: 400 });
  }
  const maxAyah = SURAH_AYAH_COUNTS[surah - 1] || 0;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyah) {
    return NextResponse.json({ error: "Invalid ayah number." }, { status: 400 });
  }

  try {
    const rawText = isLocalTafsirEdition(edition)
      ? (await getAyahTranslation(edition, surah, ayah)) || ""
      : await loadAyahText(edition, surah, ayah);

    const text = rawText ? cleanTafsirText(rawText) : "";
    return NextResponse.json({
      edition,
      surah,
      ayah,
      text
    });
  } catch {
    return NextResponse.json({ error: "Unable to load tafsir." }, { status: 502 });
  }
}
