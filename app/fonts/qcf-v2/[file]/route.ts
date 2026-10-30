import { readFileSync } from "node:fs";
import { dataPath } from "../../../lib/dataPath";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 604 }, (_, index) => ({ file: `p${index + 1}.woff2` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^p([1-9]\d{0,2})\.woff2$/.exec(file);
  if (!match || Number(match[1]) > 604) return new Response("Not found", { status: 404 });
  const body = readFileSync(dataPath("fonts", "qcf-v2", file));
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "font/woff2",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
