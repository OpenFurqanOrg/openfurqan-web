import { expect, it, vi } from "vitest";
import { fetchQuranScope } from "./fetchQuranScope";

it("loads a large translation selection in batches and preserves the first scope payload", async () => {
  const ids = ["en-arberry", "en-haleem", "bn-bengali", "bn-hoque", "bn-qurancom-161", "bn-qurancom-213", "fr-hamidullah"];
  const fetcher = vi.fn(async (url: RequestInfo | URL) => {
    const request = new URL(String(url), "https://example.com");
    const translations = request.searchParams.get("translations")!.split(",");
    return Response.json({
      ayahs: [{
        number: 1,
        transliteration: request.searchParams.has("transliteration") ? "transliteration" : undefined,
        translations: Object.fromEntries(translations.map(id => [id, { text: id }]))
      }],
      translationOrder: translations
    });
  });
  const payload = await fetchQuranScope(
    `/api/surah/1?translations=${ids.join(",")}&transliteration=1`,
    { fetcher, cacheKey: "test:large-translation-selection" }
  );

  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(payload.translationOrder).toEqual(ids);
  expect(payload.ayahs?.[0]).toMatchObject({
    transliteration: "transliteration",
    translations: Object.fromEntries(ids.map(id => [id, { text: id }]))
  });
});
