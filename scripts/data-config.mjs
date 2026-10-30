export const DATA_ORIGIN = "https://data.openfurqan.com/";

// Keep public edition IDs stable. These source variants preserve the web's editions.
export const TRANSLATIONS = {
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
export const BUNDLE_IDS = [
  "quran-text-android", "quran-metadata", "quran-metadata-android", "quran-metadata-qul-ayah",
  "quran-fonts-qcf-v2", "quran-mushaf-android", "search", "grammar-morphology", "grammar-roots", "lexicon",
  "lexicon-root-meanings", "words-arabic", "words-en", "words-transliteration",
  "timings-husary", "timings-alafasy",
  ...Object.values(TRANSLATIONS).map(id => `translation-${id}`),
  ...TAFSIRS.map(id => `tafsir-${id}`)
].sort();
