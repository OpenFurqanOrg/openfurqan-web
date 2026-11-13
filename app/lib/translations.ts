import catalog from "../data/translation-editions.json";

export type TranslationEdition = {
  id: string;
  label: string;
  author?: string;
  language: string;
  languageName: string;
  nativeLanguageName?: string;
  direction: string;
};

export const ALL_TRANSLATIONS: readonly TranslationEdition[] = catalog;
export const TRANSLATIONS_BY_ID = new Map(ALL_TRANSLATIONS.map(edition => [edition.id, edition]));
export const DEFAULT_TRANSLATION_ID = "en-arberry";
export const TRANSLATION_FEATURE = "Searchable catalog of Quran translation editions";

export function parseTranslationIds(value: string | null) {
  const ids = (value ?? "").split(",").map(id => id.trim()).filter(id => TRANSLATIONS_BY_ID.has(id));
  return ids.length ? [...new Set(ids)] : [DEFAULT_TRANSLATION_ID];
}

const normalizeSearch = (value: string) =>
  value.normalize("NFKD").toLocaleLowerCase("en").replace(/(\p{Script=Latin})\p{M}+/gu, "$1");

const searchIndex = new Map(ALL_TRANSLATIONS.map(edition => [
  edition.id,
  normalizeSearch([
    edition.label, edition.author, edition.languageName, edition.nativeLanguageName, edition.id,
    edition.language === "bn" ? "Bengali বাংলা" : ""
  ].join(" "))
]));

export function searchTranslations(query: string) {
  const terms = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean);
  return ALL_TRANSLATIONS.filter(edition => {
    const searchable = searchIndex.get(edition.id) ?? "";
    return terms.every(term => searchable.includes(term));
  });
}
