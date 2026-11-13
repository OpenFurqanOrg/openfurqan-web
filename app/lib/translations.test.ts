import { describe, expect, it } from "vitest";
import { searchTranslations, translationsForReader } from "./translations";

describe("translation comparison", () => {
  it("keeps selected editions first and adds only editions in their languages", () => {
    const editions = translationsForReader(["bn-bengali", "en-taqi-usmani", "bn-bengali"]);

    expect(editions.slice(0, 2).map(edition => edition.id)).toEqual(["bn-bengali", "en-taqi-usmani"]);
    expect(new Set(editions.map(edition => edition.language))).toEqual(new Set(["bn", "en"]));
    expect(editions.filter(edition => edition.id === "bn-bengali")).toHaveLength(1);
    expect(editions.some(edition => edition.id === "bn-qurancom-161")).toBe(true);
  });

  it("keeps other languages available in the Settings catalog", () => {
    const editions = translationsForReader(["bn-bengali"]);

    expect(editions.every(edition => edition.language === "bn")).toBe(true);
    expect(searchTranslations("Bayan-ul-Quran").some(edition => edition.id === "bayan-ul-quran")).toBe(true);
  });
});
