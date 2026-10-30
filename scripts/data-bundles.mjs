import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { gunzipSync, inflateSync } from "node:zlib";
import { createRequire } from "node:module";
// Vite 5's builtin list predates node:sqlite; keep this a native Node import.
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

export const sha256 = body => createHash("sha256").update(body).digest("hex");
export const verify = (body, size, hash, name) => {
  if (body.length !== size || sha256(body) !== hash) throw new Error(`Integrity check failed: ${name}`);
  return body;
};
export function safePath(root, name) {
  const path = resolve(root, name);
  if (!name || name.includes("\\") || name.startsWith("/") || !path.startsWith(resolve(root) + sep)) throw new Error(`Unsafe archive path: ${name}`);
  return path;
}
export const write = (path, body) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, body); };
export const writeJson = (path, value) => write(path, JSON.stringify(value));

// The data key goes to the data service only, never to a mirror.
const DATA_HOST = "data.openfurqan.com";

export async function fetchBytes(url) {
  const key = process.env.OPENFURQAN_DATA_KEY;
  const headers = key && new URL(url).hostname === DATA_HOST ? { "X-OpenFurqan-Key": key } : {};
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(60_000) });
      if (response.status === 403) {
        error = new Error(`${DATA_HOST} refused ${url}: OPENFURQAN_DATA_KEY is missing or wrong`);
        break;
      }
      if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (e) { error = e; }
  }
  throw error;
}

export function unpackBundle(sqlitePath, format, output) {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    if (db.prepare("PRAGMA quick_check").get().quick_check !== "ok") throw new Error("Invalid SQLite bundle");
    if (format === "sqlar") {
      for (const row of db.prepare("SELECT name, sz, data FROM sqlar ORDER BY name").iterate()) {
        const body = row.data.length < row.sz ? inflateSync(row.data, { maxOutputLength: row.sz }) : row.data;
        if (body.length !== row.sz) throw new Error(`Invalid archive length: ${row.name}`);
        write(safePath(output, row.name), body);
      }
    } else if (format === "ayah-sqlite") {
      for (const source of db.prepare("SELECT path, role, surah FROM source ORDER BY path").iterate()) {
        const path = safePath(output, source.path);
        if (source.role === "ayahs") {
          const ayahs = db.prepare("SELECT * FROM ayah WHERE surah = ? ORDER BY ayah").all(source.surah).map(row => {
            const value = { surah: row.surah, ayah: row.ayah };
            if (row.text !== null) value.text = row.text;
            if (row.words !== null) value.words = JSON.parse(row.words);
            if (row.footnote_ids !== null) value.footnoteIds = JSON.parse(row.footnote_ids);
            if (row.to_ayah !== null) value.to = row.to_ayah;
            return value;
          });
          writeJson(path, { ayahs });
        } else if (source.role === "footnotes") {
          writeJson(path, Object.fromEntries(db.prepare("SELECT id, text FROM footnote WHERE surah = ? ORDER BY id").all(source.surah).map(r => [r.id, r.text])));
        } else if (source.role === "file") {
          const row = db.prepare("SELECT data FROM file WHERE path = ?").get(source.path);
          if (!row) throw new Error(`Missing bundle file: ${source.path}`);
          write(path, row.data);
        } else throw new Error(`Unsupported bundle role: ${source.role}`);
      }
    } else throw new Error(`Unsupported bundle format: ${format}`);
  } finally { db.close(); }
}

export function verifiedSqlite(gzip, part) {
  verify(gzip, part.bytes, part.sha256, part.file);
  return verify(gunzipSync(gzip, { maxOutputLength: part.sqliteBytes }), part.sqliteBytes, part.sqliteSha256, part.file + " (SQLite)");
}

export function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
