import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAHS, SURAH_BY_NUMBER } from "../../../data/surahs";
import type { Metadata } from "next";
import { loadSurahSeoText, loadVerseSeoText } from "../../../lib/seoQuranText";
import SeoPlayLink from "../../../components/common/SeoPlayLink";
export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string; ayah: string }>;
};

function describeVerse(englishName: string, surahNumber: number, ayahNumber: number, english?: string) {
  const summary = `Surah ${englishName} ${surahNumber}:${ayahNumber} in Arabic with English translation.`;
  return english
    ? `"${english.slice(0, 160)}${english.length > 160 ? "..." : ""}" — ${summary}`
    : summary;
}

export async function generateStaticParams() {
  return SURAHS.flatMap((surah) =>
    Array.from({ length: surah.ayahCount }, (_, index) => ({
      slug: surah.slug,
      ayah: String(index + 1)
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ayah } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) return {};

  let verse: { ar: string; en: string } | null = null;
  try {
    verse = await loadVerseSeoText(surah.number, ayahNum);
  } catch {
    verse = null;
  }
  const title = `Surah ${surah.englishName} Ayah ${ayahNum} — ${surah.translation} (${surah.number}:${ayahNum})`;
  const description = describeVerse(surah.englishName, surah.number, ayahNum, verse?.en);

  return {
    title,
    description,
    alternates: {
      canonical: `/surah/${slug}/${ayahNum}`
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com/surah/${slug}/${ayahNum}`,
      siteName: "OpenFurqan",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: `${surah.englishName} ${surah.number}:${ayahNum}`,
      description
    }
  };
}

export default async function AyahPage({ params }: Props) {
  const { slug, ayah } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  const ayahNum = Number(ayah);
  if (!surah || !Number.isInteger(ayahNum) || ayahNum < 1 || ayahNum > surah.ayahCount) {
    notFound();
  }

  let surahText: Partial<Record<string, { ar: string; en: string }>> = {};
  try {
    surahText = await loadSurahSeoText(surah.number);
  } catch {
    surahText = {};
  }
  let verse: { ar: string; en: string } | null = surahText[String(ayahNum)] || null;
  if (!verse) {
    try {
      verse = await loadVerseSeoText(surah.number, ayahNum);
    } catch {
      verse = null;
    }
  }

  const nearbyVerses: Array<{ num: number; ar: string; en: string }> = [];
  const contextStart = Math.max(1, ayahNum - 2);
  const contextEnd = Math.min(surah.ayahCount, ayahNum + 2);
  for (let n = contextStart; n <= contextEnd; n++) {
    if (n === ayahNum) continue;
    const contextVerse = surahText[String(n)];
    if (!contextVerse) continue;
    nearbyVerses.push({ num: n, ...contextVerse });
  }

  const prevAyah = ayahNum > 1 ? ayahNum - 1 : null;
  const nextAyah = ayahNum < surah.ayahCount ? ayahNum + 1 : null;

  // Find prev/next surah for boundary navigation
  const prevSurah = surah.number > 1 ? SURAH_BY_NUMBER.get(surah.number - 1) : null;
  const nextSurah = surah.number < 114 ? SURAH_BY_NUMBER.get(surah.number + 1) : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://openfurqan.com" },
      { "@type": "ListItem", position: 2, name: `Surah ${surah.englishName}`, item: `https://openfurqan.com/surah/${slug}` },
      { "@type": "ListItem", position: 3, name: `Ayah ${ayahNum}`, item: `https://openfurqan.com/surah/${slug}/${ayahNum}` }
    ]
  };

  const verseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Surah ${surah.englishName} Ayah ${ayahNum} (${surah.number}:${ayahNum})`,
    description: describeVerse(surah.englishName, surah.number, ayahNum, verse?.en),
    articleBody: verse ? `${verse.ar}\n\n${verse.en}` : undefined,
    url: `https://openfurqan.com/surah/${slug}/${ayahNum}`,
    isPartOf: {
      "@type": "Chapter",
      name: `Surah ${surah.englishName}`,
      url: `https://openfurqan.com/surah/${slug}`,
      position: surah.number
    },
    inLanguage: ["en", "ar"],
    publisher: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: "https://openfurqan.com"
    }
  };

  return (
    <div className="seo-page seo-reading-page">
      <link rel="preload" href="https://cdn.jsdelivr.net/fontsource/fonts/scheherazade-new@latest/arabic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(verseJsonLd) }} />

      <div className="seo-container">
        <Link href="/" className="seo-wordmark" aria-label="OpenFurqan home">
          Open<span>Furqan</span>
        </Link>
        {/* Header */}
        <header className="seo-header">
          <p className="seo-arabic-title" lang="ar" dir="rtl">{surah.arabicName}</p>
          <h1 className="seo-english-title">Surah {surah.englishName} — Ayah {ayahNum}</h1>
          <p className="seo-translation">{surah.translation}</p>
          <div className="seo-meta">
            <span>{surah.revelationType}</span>
            <span className="seo-meta-dot" aria-hidden="true">&middot;</span>
            <span>Surah {surah.number}</span>
            <span className="seo-meta-dot" aria-hidden="true">&middot;</span>
            <span>{surah.ayahCount} ayahs</span>
          </div>
        </header>

        {/* Verse Content */}
        {verse && (
          <article className="seo-verse">
            <p className="seo-verse-arabic" lang="ar" dir="rtl">{verse.ar}</p>
            <p className="seo-verse-english">{verse.en}</p>
          </article>
        )}
        {nearbyVerses.length > 0 && (
          <section className="seo-context-section" aria-labelledby="ayah-context-title">
            <h2 id="ayah-context-title" className="seo-context-title">
              Nearby ayahs
            </h2>
            {nearbyVerses.map((contextVerse) => (
              <article key={contextVerse.num} className="seo-verse seo-verse-context">
                <div className="seo-verse-ref">
                  <Link href={`/surah/${slug}/${contextVerse.num}`}>{surah.number}:{contextVerse.num}</Link>
                </div>
                <p className="seo-verse-arabic" lang="ar" dir="rtl">{contextVerse.ar}</p>
                <p className="seo-verse-english">{contextVerse.en}</p>
              </article>
            ))}
          </section>
        )}

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href={`/?surah=${surah.number}&ayah=${ayahNum}`} className="seo-cta">
            Open in Reader &rarr;
          </Link>
          <SeoPlayLink />
        </div>

        {/* Navigation */}
        <nav className="seo-nav">
          {prevAyah ? (
            <Link href={`/surah/${slug}/${prevAyah}`}>
              &larr; Ayah {prevAyah}
            </Link>
          ) : prevSurah ? (
            <Link href={`/surah/${prevSurah.slug}/${prevSurah.ayahCount}`}>
              &larr; {prevSurah.englishName} {prevSurah.ayahCount}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href={`/surah/${slug}`}>
            All Ayahs
          </Link>

          {nextAyah ? (
            <Link href={`/surah/${slug}/${nextAyah}`}>
              Ayah {nextAyah} &rarr;
            </Link>
          ) : nextSurah ? (
            <Link href={`/surah/${nextSurah.slug}/1`}>
              {nextSurah.englishName} 1 &rarr;
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}
        </nav>

        {/* Footer */}
        <footer className="seo-footer">
          <p>
            <Link href="/">OpenFurqan</Link> — Read the Quran with translations, audio & study tools.
            {" | "}<Link href="/about">About</Link>{" | "}<Link href="/faq">FAQ</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
