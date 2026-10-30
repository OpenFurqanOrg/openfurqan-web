import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { TAFSIRS } from "./data-config.mjs";

// A local server can accidentally work using files that a serverless function
// would omit. Check Next's actual deployment traces after every production build.
const required = {
  "fonts/qcf-v2/[file]/route": ["fonts/qcf-v2/p1.woff2", "fonts/qcf-v2/p604.woff2"],
  "api/surah/[id]/route": ["quran-text.json", "translations/en-arberry.json"],
  "api/ayah/translations/route": ["translations/bn-bengali.json"],
  "api/ayah/taqi-usmani/route": ["translations/en-taqi-usmani.json"],
  "api/page/[id]/route": ["quran-metadata-ayah.json", "quran-metadata-page.json", "quran-page-layouts/page-001.json", "translations/en-arberry.json"],
  "api/juz/[id]/route": ["quran-metadata-ayah.json", "quran-metadata-page.json", "quran-metadata-juz.json", "translations/en-arberry.json"],
  "api/words/[id]/route": ["quran-words.json", "quran-morphology.mustafa.txt"],
  "api/audio-timings/[reciter]/[surah]/route": ["audio-timings/husary/001.json", "audio-timings/alafasy/114.json"],
  "api/lexicon/root/[root]/route": ["root-explorer/0631-062d-0645.json", "lane-lexicon.json", "root-meanings.primary.json", "root-meanings.qj.json", "quran-morphology.mustafa.txt"],
  "api/search/route": ["quran-search-index.json", "quran-metadata-surah-name.json"],
  "api/tafsir/route": [...TAFSIRS.map(id => `tafsir/${id}/1.json`), "translations/en-maududi.json"],
  "api/memorization/deck/route": ["quran-words.json", "quran-morphology.mustafa.txt", "quran-metadata-ayah.json", "quran-metadata-page.json", "quran-metadata-juz.json", "translations/en-haleem.json"],
  "surah/[slug]/page": ["quran-seo/surah-001.json"],
  "surah/[slug]/[ayah]/page": ["quran-seo/surah-114.json"]
};
for (const [route, names] of Object.entries(required)) {
  const tracePath = resolve(".next/server/app", `${route}.js.nft.json`);
  const files = new Set(JSON.parse(readFileSync(tracePath, "utf8")).files.map(path => resolve(dirname(tracePath), path)));
  for (const name of names) {
    const path = resolve(".openfurqan-data/current", name);
    if (!files.has(path)) throw new Error(`Deployment trace missing ${name} for ${route}`);
  }
  for (const file of files) if (/\.openfurqan-data\/(?:bundles|source-|previous-|staging-)/.test(file)) throw new Error(`Deployment includes build cache: ${route}`);
}
console.log(`Verified Quran data in ${Object.keys(required).length} production traces.`);
