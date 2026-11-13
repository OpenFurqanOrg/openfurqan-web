import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseTranslationIds } from "../../../lib/translations";
import { apiRateGuard } from "../../../lib/apiRateLimit";
import { getPageLayout } from "../../../lib/quranPageLayoutLoader";
import { getPagePayload } from "../../../lib/quranScopeLoader";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const blocked = await apiRateGuard(request, "api-page");
  if (blocked) return blocked;

  const { id } = await Promise.resolve(params);
  const pageNumber = Number(id);

  if (!id || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 604) {
    return NextResponse.json({ error: "Invalid page id." }, { status: 400 });
  }

  try {
    const transliterationParam = String(
      request.nextUrl.searchParams.get("transliteration") || ""
    ).toLowerCase();
    const includeTransliteration = ["1", "true", "yes", "on"].includes(
      transliterationParam
    );
    const translationIds = parseTranslationIds(request.nextUrl.searchParams.get("translations"));
    const payload = await getPagePayload(
      pageNumber,
      translationIds,
      includeTransliteration
    );
    const layout = await getPageLayout(pageNumber);

    if (!payload) {
      return NextResponse.json({ error: "Page not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        scope: {
          type: "page",
          id: pageNumber,
          label: `Page ${pageNumber}`,
          versesCount: payload.entry.verses_count,
          firstVerseKey: payload.entry.first_verse_key,
          lastVerseKey: payload.entry.last_verse_key
        },
        sections: payload.sections,
        ayahs: payload.ayahs,
        layout,
        arabicScript: "uthmani",
        translationOrder: translationIds
      },
      { headers: CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load page data." },
      { status: 502 }
    );
  }
}
