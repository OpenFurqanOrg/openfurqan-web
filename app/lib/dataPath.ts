import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Hydrated by predev/prebuild. Runtime routes never download Quran data. */
export const dataPath = (...parts: string[]) =>
  // The precise runtime files are listed per route in next.config.js.
  join(/* turbopackIgnore: true */ process.cwd(), ".openfurqan-data", "current", ...parts);

export const readDataJson = <T>(...parts: string[]): T =>
  JSON.parse(readFileSync(dataPath(...parts), "utf8")) as T;
