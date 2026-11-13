export const DATA_ORIGIN = "https://data.openfurqan.com/";

// Keep public edition IDs stable. These source variants preserve the web's editions.
export const LEGACY_TRANSLATIONS = {
  "bayan-ul-quran": "bayan-ul-quran",
  "bengali-mokhtasar": "bengali-mokhtasar",
  "bn-bengali": "bn-bengali",
  "bn-hoque": "bn-hoque",
  "bn-tafsir-ahsanul-bayaan": "bn-tafsir-ahsanul-bayaan",
  "de-bubenheim": "de-bubenheim-android",
  "en-ahmedraza": "en-ahmedraza",
  "en-arberry": "en-arberry",
  "en-haleem": "en-haleem-android",
  "en-maarif-ul-quran": "en-maarif-ul-quran",
  "en-maududi": "en-maududi-android",
  "en-muhsin-khan": "en-muhsin-khan-android",
  "en-pickthall": "en-pickthall-android",
  "en-sahih": "en-sahih-android",
  "en-taqi-usmani": "en-taqi-usmani-android",
  "en-transliteration": "en-transliteration-android",
  "en-yusufali": "en-yusufali-android",
  "es-cortes": "es-cortes",
  "fr-hamidullah": "fr-hamidullah-android",
  "hi-hindi": "hi-hindi-android",
  "hi-tafsir-farooq": "hi-tafsir-farooq",
  "si-naseem-ismail": "si-naseem-ismail",
  "tr-ates": "tr-ates",
  "ur-kanzuliman": "ur-kanzuliman"
};
export const TAFSIRS = [
  "en-tafsir-maarif-ul-quran", "en-kashf-al-asrar-tafsir", "en-al-jalalayn",
  "ur-tafsir-bayan-ul-quran", "en-asbab-al-nuzul-by-al-wahidi",
  "en-al-qushairi-tafsir", "en-tafsir-ibn-abbas", "en-tafsir-al-tustari"
];
export const CORE_BUNDLE_IDS = [
  "quran-text-android", "quran-metadata", "quran-metadata-android", "quran-metadata-qul-ayah",
  "quran-fonts-qcf-v2", "quran-mushaf-android", "search", "grammar-morphology", "grammar-roots", "lexicon",
  "lexicon-root-meanings", "words-arabic", "words-en", "words-transliteration",
  "timings-husary", "timings-alafasy",
  ...TAFSIRS.map(id => `tafsir-${id}`)
].sort();

export function translationCatalog(bundles) {
  const translations = bundles.filter(bundle => bundle.kind === "translation");
  const sourceIds = new Set(translations.map(bundle => bundle.edition));
  const legacyIds = new Map(Object.entries(LEGACY_TRANSLATIONS).map(([id, edition]) => [edition, id]));
  for (const edition of legacyIds.keys()) {
    if (!sourceIds.has(edition)) throw new Error(`Required translation missing: ${edition}`);
  }

  const languageNames = new Intl.DisplayNames("en", { type: "language", fallback: "none" });
  const collator = new Intl.Collator("en");
  const editions = translations.map(({ edition, catalog }) => {
    if (!/^[a-z][a-z0-9-]*$/.test(edition) || !catalog?.name || !catalog.language ||
        !["ltr", "rtl"].includes(catalog.direction)) {
      throw new Error(`Invalid translation metadata: ${edition}`);
    }
    const legacyId = legacyIds.get(edition);
    // The existing selection keeps its text. Give the other version its own ID.
    const alternate = !legacyId && Object.hasOwn(LEGACY_TRANSLATIONS, edition);
    const id = legacyId ?? (alternate ? `${edition}-alternate` : edition);
    const language = catalog.language;
    const languageName = language === "bn" ? "Bangla" : languageNames.of(language) ?? catalog.languageName ?? language;
    return {
      id,
      edition,
      label: alternate ? `${catalog.name} (Alternate edition)` : catalog.name,
      author: catalog.authorNative || catalog.authorLatin || catalog.author || undefined,
      language,
      languageName,
      nativeLanguageName: catalog.languageNativeName || undefined,
      direction: catalog.direction
    };
  });
  if (new Set(editions.map(edition => edition.id)).size !== editions.length) {
    throw new Error("Duplicate translation edition IDs");
  }

  const names = new Map();
  // Prefer the established edition's name when two entries have the same title.
  editions.sort((a, b) => Number(legacyIds.has(b.edition)) - Number(legacyIds.has(a.edition)) || collator.compare(a.id, b.id));
  for (const entry of editions) {
    const key = `${entry.language}:${entry.label}`;
    const count = names.get(key) ?? 0;
    if (count === 1) entry.label += " (Alternate edition)";
    if (count > 1) entry.label += ` (Alternate edition ${count})`;
    names.set(key, count + 1);
  }
  return editions.sort((a, b) => Number(b.language === "en") - Number(a.language === "en") ||
    collator.compare(a.languageName, b.languageName) || collator.compare(a.label, b.label) ||
    collator.compare(a.id, b.id));
}
