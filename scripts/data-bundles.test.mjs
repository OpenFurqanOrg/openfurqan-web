// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { deflateSync, gzipSync } from "node:zlib";
import { safePath, sha256, unpackBundle, verify, verifiedSqlite } from "./data-bundles.mjs";
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");

describe("published bundle integrity", () => {
  it("rejects changed downloaded and uncompressed bytes", () => {
    const sqlite = Buffer.from("SQLite fixture");
    const gzip = gzipSync(sqlite);
    const part = { file: "bundle", bytes: gzip.length, sha256: sha256(gzip), sqliteBytes: sqlite.length, sqliteSha256: sha256(sqlite) };
    expect(verifiedSqlite(gzip, part)).toEqual(sqlite);
    expect(() => verifiedSqlite(gzip, { ...part, sqliteSha256: "0".repeat(64) })).toThrow(/Integrity/);
    expect(() => verifiedSqlite(Buffer.from("broken"), part)).toThrow(/Integrity/);
    expect(() => verify(gzip, gzip.length - 1, part.sha256, "bundle")).toThrow(/Integrity/);
  });
  it("rejects archive paths outside the extraction directory", () => {
    const folder = join(tmpdir(), "openfurqan-safe-path");
    for (const path of ["../outside", "/absolute", "nested/../../outside", "a\\..\\b", ""]) expect(() => safePath(folder, path)).toThrow(/Unsafe/);
    expect(safePath(folder, "search/1.json")).toBe(join(folder, "search/1.json"));
  });
  it("extracts both compressed and literal SQLAR entries", () => {
    const folder = mkdtempSync(join(tmpdir(), "openfurqan-sqlar-"));
    const path = join(folder, "test.sqlite");
    const db = new DatabaseSync(path);
    db.exec("CREATE TABLE sqlar(name TEXT, sz INT, data BLOB)");
    const body = Buffer.from("word ".repeat(100));
    db.prepare("INSERT INTO sqlar VALUES (?, ?, ?)").run("search/1.json", body.length, deflateSync(body));
    db.prepare("INSERT INTO sqlar VALUES (?, ?, ?)").run("index.json", 2, Buffer.from("{}"));
    db.close();
    unpackBundle(path, "sqlar", join(folder, "out"));
    expect(readFileSync(join(folder, "out/search/1.json"))).toEqual(body);
    expect(readFileSync(join(folder, "out/index.json"), "utf8")).toBe("{}");
  });
  it("reconstructs ayahs, ranges, words, footnotes and raw metadata", () => {
    const folder = mkdtempSync(join(tmpdir(), "openfurqan-ayah-"));
    const path = join(folder, "test.sqlite");
    const db = new DatabaseSync(path);
    db.exec(`CREATE TABLE source(path TEXT, role TEXT, surah INT);
      CREATE TABLE ayah(surah INT, ayah INT, text TEXT, words TEXT, footnote_ids TEXT, to_ayah INT);
      CREATE TABLE footnote(surah INT, id TEXT, text TEXT);
      CREATE TABLE file(path TEXT, data BLOB);
      INSERT INTO source VALUES ('tafsir/test/2.json', 'ayahs', 2), ('tafsir/test/footnotes/2.json', 'footnotes', 2), ('tafsir/test/edition.json', 'file', NULL);
      INSERT INTO ayah VALUES (2, 8, 'commentary', '["word"]', '["n1"]', 10);
      INSERT INTO footnote VALUES (2, 'n1', 'note');
      INSERT INTO file VALUES ('tafsir/test/edition.json', '{}');`);
    db.close();
    unpackBundle(path, "ayah-sqlite", join(folder, "out"));
    expect(JSON.parse(readFileSync(join(folder, "out/tafsir/test/2.json"), "utf8"))).toEqual({ ayahs: [{ surah: 2, ayah: 8, text: "commentary", words: ["word"], footnoteIds: ["n1"], to: 10 }] });
    expect(JSON.parse(readFileSync(join(folder, "out/tafsir/test/footnotes/2.json"), "utf8"))).toEqual({ n1: "note" });
    expect(readFileSync(join(folder, "out/tafsir/test/edition.json"), "utf8")).toBe("{}");
  });
});
