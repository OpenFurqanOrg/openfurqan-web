import { fetchJSON, type FetchJSONOptions } from "./apiClient";

type ScopePayload = {
  ayahs?: { translations?: Record<string, { text?: string }> }[];
  translationOrder?: string[];
};

// Batch large selections so a long surah or juz fits in a function response.
const TRANSLATIONS_PER_REQUEST = 6;

export async function fetchQuranScope<T extends ScopePayload>(url: string, options: FetchJSONOptions) {
  const [pathname, query] = url.split("?");
  const params = new URLSearchParams(query);
  const ids = params.get("translations")?.split(",") ?? [];
  if (ids.length <= TRANSLATIONS_PER_REQUEST) return fetchJSON<T>(url, options);

  const loadBatch = (start: number) => {
    const batch = ids.slice(start, start + TRANSLATIONS_PER_REQUEST);
    params.set("translations", batch.join(","));
    if (start > 0) params.delete("transliteration");
    return fetchJSON<T>(`${pathname}?${params}`, {
      ...options,
      cacheKey: options.cacheKey && `${options.cacheKey}:${start}`
    });
  };
  const first = await loadBatch(0);
  const ayahs = first.ayahs?.map(ayah => ({ ...ayah, translations: { ...ayah.translations } }));
  const translationOrder = [...(first.translationOrder ?? [])];
  for (let start = TRANSLATIONS_PER_REQUEST; start < ids.length; start += TRANSLATIONS_PER_REQUEST) {
    options.signal?.throwIfAborted();
    const data = await loadBatch(start);
    data.ayahs?.forEach((ayah, index) => {
      const target = ayahs?.[index];
      if (target) Object.assign(target.translations, ayah.translations);
    });
    translationOrder.push(...(data.translationOrder ?? []));
  }
  return { ...first, ayahs, translationOrder };
}
