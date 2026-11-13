import { existsSync, mkdirSync, readFileSync, renameSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { CORE_BUNDLE_IDS, DATA_ORIGIN, TAFSIRS, translationCatalog } from "./data-config.mjs";
import { sha256, verify, fetchBytes, verifiedSqlite, unpackBundle, readJson, write, writeJson } from "./data-bundles.mjs";
import { DatabaseSync } from "node:sqlite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const storage = join(root, ".openfurqan-data");
const lockPath = join(root, "data.lock.json");
const catalogPath = join(root, "app/data/translation-editions.json");
const translationMetadata = editions => editions.map(
  ({ id, label, author, language, languageName, nativeLanguageName, direction }) =>
    ({ id, label, author, language, languageName, nativeLanguageName, direction })
);
// The data key: on Vercel an environment variable, locally the ignored .env.local.
if (existsSync(join(root, ".env.local"))) process.loadEnvFile(join(root, ".env.local"));
const downloadOrigin = new URL(process.env.OPENFURQAN_DATA_MIRROR || DATA_ORIGIN);
if (downloadOrigin.protocol !== "https:" && !(downloadOrigin.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(downloadOrigin.hostname))) throw new Error("Data mirror must use HTTPS or loopback HTTP");

// Updating the lock is explicit. Ordinary builds never follow a mutable release.
if (process.argv.includes("--update-lock")) {
  const manifest = await fetchBytes(new URL("bundles.json", downloadOrigin));
  const listing = JSON.parse(manifest);
  if (listing.schemaVersion !== 1) throw new Error("Unsupported bundle manifest");
  const published = new Map(listing.bundles.map(bundle => [bundle.id, bundle]));
  const bundleIds = [...CORE_BUNDLE_IDS, ...listing.bundles.filter(b => b.kind === "translation").map(b => b.id)].sort();
  const bundles = bundleIds.map(id => {
    const b = published.get(id);
    if (!b) throw new Error(`Required bundle not published: ${id}`);
    if (b.kind !== "translation") return b;
    const { id: bundleId, kind, format, edition, parts, catalog } = b;
    const { name, author, authorLatin, authorNative, language, languageName, languageNativeName, direction } = catalog;
    return {
      id: bundleId, kind, format, edition, parts,
      catalog: { name, author, authorLatin, authorNative, language, languageName, languageNativeName, direction }
    };
  });
  const catalog = JSON.stringify(translationMetadata(translationCatalog(bundles)), null, 2) + "\n";
  // One line per bundle makes each intentional data update easy to review.
  write(lockPath, '{\n  "schemaVersion": 1,\n  "origin": ' + JSON.stringify(DATA_ORIGIN) + ',\n  "manifestSha256": ' + JSON.stringify(sha256(manifest)) + ',\n  "bundles": [\n' + bundles.map(b => '    ' + JSON.stringify(b)).join(',\n') + '\n  ]\n}\n');
  write(catalogPath, catalog);
  console.log(`Pinned ${bundles.length} bundles and updated the translation catalog.`);
  process.exit(0);
}

const lockBytes = readFileSync(lockPath);
const lock = JSON.parse(lockBytes);
if (lock.schemaVersion !== 1 || lock.origin !== DATA_ORIGIN) throw new Error("Unsupported data lock");
if (JSON.stringify(lock.bundles.filter(b => b.kind !== "translation").map(b => b.id).sort()) !== JSON.stringify(CORE_BUNDLE_IDS)) throw new Error("Bundle lock does not match required datasets. Run npm run data:update and review it.");
const editions = translationCatalog(lock.bundles);
if (JSON.stringify(readJson(catalogPath)) !== JSON.stringify(translationMetadata(editions))) {
  throw new Error("Translation catalog does not match the data lock. Run npm run data:update and review it.");
}
const adapter = ["prepare-data.mjs", "data-config.mjs", "data-bundles.mjs", "timing-provenance.json"].map(f => readFileSync(join(root, "scripts", f)));
const fingerprint = sha256(Buffer.concat([lockBytes, ...adapter]));
const current = join(storage, "current");
// Verify installed outputs too: a truncated/missing file must repair itself.
if (existsSync(join(current, "ready.json"))) {
  try {
    const ready = readJson(join(current, "ready.json"));
    if (ready.fingerprint === fingerprint && Object.entries(ready.files).every(([name, entry]) => {
      const body = readFileSync(join(current, name));
      return body.length === entry.bytes && sha256(body) === entry.sha256;
    })) { console.log("OpenFurqan data verified (cached)."); process.exit(0); }
  } catch { /* Rehydrate from verified bundles below. */ }
}

const started = performance.now();
const manifest = JSON.parse(await fetchBytes(new URL("bundles.json", downloadOrigin)));
if (manifest.schemaVersion !== 1) throw new Error("Unsupported bundle manifest");
// The live list can advance; keep using immutable URLs and checksums from the lock.
const live = new Map(manifest.bundles.map(b => [b.id, b]));
for (const b of lock.bundles) if (JSON.stringify(live.get(b.id)?.parts) !== JSON.stringify(b.parts)) console.log(`Using pinned release of ${b.id}`);
const stage = join(storage, `staging-${Date.now()}-${process.pid}`);
const raw = join(stage, "raw");
mkdirSync(raw, { recursive: true });
let downloaded = 0;
// Bound network and SQLite memory use on small build hosts.
const queue = [...lock.bundles];
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let bundle; (bundle = queue.shift());) {
    for (const part of bundle.parts) {
      if (!/^bundles\/[a-z0-9.-]+\.sqlite\.gz$/.test(part.file) || !/^[a-f0-9]{64}$/.test(part.sha256) || !/^[a-f0-9]{64}$/.test(part.sqliteSha256)) throw new Error("Invalid locked bundle path/checksum");
      const gzipPath = join(storage, "bundles", part.sha256 + ".sqlite.gz");
      let packed;
      try { packed = verify(readFileSync(gzipPath), part.bytes, part.sha256, part.file); } catch {
        packed = verify(await fetchBytes(new URL(part.file, downloadOrigin)), part.bytes, part.sha256, part.file);
        write(gzipPath, packed); downloaded += packed.length;
      }
      const sqlite = verifiedSqlite(packed, part);
      const sqlitePath = join(raw, ".sqlite", part.sqliteSha256 + ".sqlite");
      write(sqlitePath, sqlite);
      unpackBundle(sqlitePath, bundle.format, raw);
    }
  }
}));

const read = name => readJson(join(raw, name));
const save = (name, data) => writeJson(join(stage, name), data);
const copy = (from, to) => write(join(stage, to), readFileSync(join(raw, from)));
const search = [];
const quran = {};
const words = {};
const ayahMeta = {};
let corpus = "";
for (let s = 1; s <= 114; s++) {
  const pad = String(s).padStart(3, "0");
  const entries = read(`search/${s}.json`);
  search.push(...entries);
  const english = new Map(entries.map(e => [e.a, e.en]));
  const text = read(`quran/text/android/${pad}.json`);
  if (entries.length !== Object.keys(text).length) throw new Error(`Incomplete search/text data for surah ${s}`);
  for (const [a, verse] of Object.entries(text)) {
    if (!english.has(Number(a))) throw new Error(`Missing clean English: ${s}:${a}`);
    verse.en = english.get(Number(a));
  }
  quran[s] = text;
  save(`quran-seo/surah-${pad}.json`, Object.fromEntries(Object.entries(text).map(([a, v]) => [a, { ar: v.ar, en: v.en }])));
  Object.assign(ayahMeta, read(`quran/metadata/qul-ayah/${pad}.json`));
  const meanings = new Map(read(`words/en/${s}.json`).ayahs.map(a => [a.ayah, a.words]));
  const transliteration = new Map(read(`words/transliteration/${s}.json`).ayahs.map(a => [a.ayah, a.words]));
  words[s] = Object.fromEntries(read(`words/arabic/${s}.json`).ayahs.map(a => {
    if (a.words.length !== meanings.get(a.ayah)?.length || a.words.length !== transliteration.get(a.ayah)?.length) throw new Error(`Word alignment mismatch ${s}:${a.ayah}`);
    return [a.ayah, a.words.map((arabic, i) => ({ a: arabic, t: meanings.get(a.ayah)[i], tr: transliteration.get(a.ayah)[i], p: i + 1 }))];
  }));
  corpus += readFileSync(join(raw, `grammar/morphology/${s}.txt`), "utf8").trimEnd() + "\n";
}
if (search.length !== 6236 || Object.keys(ayahMeta).length !== 6236) throw new Error("Incomplete Quran");
save("quran-text.json", quran);
save("quran-words.json", words);
save("quran-search-index.json", search);
save("quran-metadata-ayah.json", ayahMeta);
write(join(stage, "quran-morphology.mustafa.txt"), corpus);
for (const part of ["juz", "hizb", "manzil", "rub", "ruku"]) copy(`quran/metadata/${part}.json`, `quran-metadata-${part}.json`);
copy("quran/metadata/android/page.json", "quran-metadata-page.json");
copy("quran/metadata/surahs.json", "quran-metadata-surah-name.json");
copy("lexicon/lane.json", "lane-lexicon.json");
for (const kind of ["primary", "qj"]) copy(`lexicon/root-meanings/${kind}.json`, `root-meanings.${kind}.json`);
for (const name of readdirSync(join(raw, "grammar/roots"))) copy(`grammar/roots/${name}`, `root-explorer/${name}`);
for (let page = 1; page <= 604; page++) copy(`quran/fonts/qcf-v2/p${page}.woff2`, `fonts/qcf-v2/p${page}.woff2`);
for (const name of readdirSync(join(raw, "quran/mushaf/android"))) copy(`quran/mushaf/android/${name}`, `quran-page-layouts/${name}`);
const timingProvenance = readJson(join(root, "scripts/timing-provenance.json"));
for (const reciter of ["husary", "alafasy"]) for (const name of readdirSync(join(raw, `audio/timings/${reciter}`))) {
  const timing = read(`audio/timings/${reciter}/${name}`);
  // The shared service omits import dates; retain this small legacy API metadata.
  timing.source = timingProvenance[reciter][name.replace(".json", "")];
  save(`audio-timings/${reciter}/${name}`, timing);
}
// Keep the full catalog under the function bundle limit with one indexed,
// independently compressed chapter per edition.
const translationDb = new DatabaseSync(join(stage, "translations.sqlite"));
try {
  translationDb.exec(`CREATE TABLE chapter (
    surah INTEGER NOT NULL, edition TEXT NOT NULL, verses BLOB NOT NULL,
    PRIMARY KEY (surah, edition)
  ) WITHOUT ROWID; BEGIN`);
  const insertChapter = translationDb.prepare("INSERT INTO chapter VALUES (?, ?, ?)");
  for (const { id, edition } of editions) {
    for (let surah = 1; surah <= 114; surah++) {
      const entries = read(`translations/${edition}/${surah}.json`).ayahs;
      if (entries.length !== Object.keys(quran[surah]).length ||
          entries.some((entry, index) => entry.ayah !== index + 1)) {
        throw new Error(`Incomplete translation: ${edition}, surah ${surah}`);
      }
      const verses = entries.map(entry => entry.text ?? "");
      insertChapter.run(surah, id, gzipSync(JSON.stringify(verses)));
    }
  }
  translationDb.exec("COMMIT");
} finally {
  translationDb.close();
}
for (const edition of TAFSIRS) for (let s = 1; s <= 114; s++) copy(`tafsir/${edition}/${s}.json`, `tafsir/${edition}/${s}.json`);
const files = {};
function inventory(folder, prefix = "") {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!prefix && entry.name === "raw") continue;
    const name = prefix + entry.name;
    if (entry.isDirectory()) inventory(join(folder, entry.name), name + "/");
    else { const body = readFileSync(join(folder, entry.name)); files[name] = { bytes: body.length, sha256: sha256(body) }; }
  }
}
inventory(stage);
save("ready.json", { fingerprint, files });
// Extraction inputs do not belong in the traced runtime tree.
rmSync(raw, { recursive: true, force: true });
// Install atomically. The generation before stays for anything still reading it; older ones go.
if (existsSync(current)) renameSync(current, join(storage, `previous-${Date.now()}`));
renameSync(stage, current);
const previous = readdirSync(storage).filter(name => /^previous-\d+$/.test(name)).sort();
for (const name of [...readdirSync(storage).filter(name => name.startsWith("source-")), ...previous.slice(0, -1)]) {
  rmSync(join(storage, name), { recursive: true, force: true });
}
console.log(`Prepared ${lock.bundles.length} bundles, ${Object.keys(files).length} files; downloaded ${(downloaded / 1e6).toFixed(2)} MB in ${((performance.now() - started) / 1000).toFixed(2)}s.`);
