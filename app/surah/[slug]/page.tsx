import { notFound } from "next/navigation";
import Link from "next/link";
import { SURAH_BY_SLUG, SURAHS, SURAH_BY_NUMBER } from "../../data/surahs";
import type { Metadata } from "next";
import { loadFirstVerseSeoText, loadSurahSeoText } from "../../lib/seoQuranText";
import SeoPlayLink from "../../components/common/SeoPlayLink";

export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return SURAHS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) return {};

  let firstVerse: { ar: string; en: string } | null = null;
  try {
    firstVerse = await loadFirstVerseSeoText(surah.number);
  } catch {
    firstVerse = null;
  }
  const snippet = firstVerse?.en ? firstVerse.en.slice(0, 120) : "";

  const title = `Surah ${surah.englishName} (${surah.arabicName}) — ${surah.translation}`;
  const description = snippet
    ? `"${snippet}${firstVerse!.en.length > 120 ? "..." : ""}" — Surah ${surah.englishName}: all ${surah.ayahCount} ayahs in Arabic with English translation.`
    : `Read all ${surah.ayahCount} ayahs of Surah ${surah.englishName} (${surah.translation}) in Arabic with English translation.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/surah/${slug}`
    },
    openGraph: {
      title,
      description,
      url: `https://openfurqan.com/surah/${slug}`,
      siteName: "OpenFurqan",
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: `Surah ${surah.englishName} — ${surah.translation}`,
      description
    }
  };
}

export default async function SurahPage({ params }: Props) {
  const { slug } = await params;
  const surah = SURAH_BY_SLUG.get(slug);
  if (!surah) notFound();

  let surahText: Partial<Record<string, { ar: string; en: string }>> = {};
  try {
    surahText = await loadSurahSeoText(surah.number);
  } catch {
    surahText = {};
  }

  // Render all ayahs for stronger content depth and crawlability.
  const allVerses = [];
  for (let i = 1; i <= surah.ayahCount; i++) {
    const v = surahText[String(i)];
    if (v) allVerses.push({ num: i, ...v });
  }

  const prevSurah = surah.number > 1 ? SURAH_BY_NUMBER.get(surah.number - 1) : null;
  const nextSurah = surah.number < 114 ? SURAH_BY_NUMBER.get(surah.number + 1) : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://openfurqan.com" },
      { "@type": "ListItem", position: 2, name: `Surah ${surah.englishName}`, item: `https://openfurqan.com/surah/${slug}` }
    ]
  };

  const chapterJsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    name: `Surah ${surah.englishName}`,
    alternateName: surah.arabicName,
    description: `${surah.translation} — ${surah.ayahCount} ayahs, ${surah.revelationType} surah`,
    position: surah.number,
    url: `https://openfurqan.com/surah/${slug}`,
    isPartOf: {
      "@type": "Book",
      name: "The Holy Quran",
      url: "https://openfurqan.com"
    },
    inLanguage: ["en", "ar"],
    provider: {
      "@type": "WebApplication",
      name: "OpenFurqan",
      url: "https://openfurqan.com"
    }
  };

  return (
    <div className="seo-page seo-reading-page">
      <link rel="preload" href="https://cdn.jsdelivr.net/fontsource/fonts/scheherazade-new@latest/arabic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd) }} />

      <div className="seo-container">
        <Link href="/" className="seo-wordmark" aria-label="OpenFurqan home">
          Open<span>Furqan</span>
        </Link>
        {/* Header */}
        <header className="seo-header">
          <p className="seo-arabic-title" lang="ar" dir="rtl">{surah.arabicName}</p>
          <h1 className="seo-english-title">Surah {surah.englishName}</h1>
          <p className="seo-translation">{surah.translation}</p>
          <div className="seo-meta">
            <span>{surah.revelationType}</span>
            <span className="seo-meta-dot" aria-hidden="true">&middot;</span>
            <span>Surah {surah.number}</span>
            <span className="seo-meta-dot" aria-hidden="true">&middot;</span>
            <span>{surah.ayahCount} ayahs</span>
          </div>
        </header>

        {/* Full Surah Verses */}
        <section>
          {allVerses.map((v) => (
            <article key={v.num} className="seo-verse">
              <div className="seo-verse-ref">
                <Link href={`/surah/${slug}/${v.num}`}>{surah.number}:{v.num}</Link>
              </div>
              <p className="seo-verse-arabic" lang="ar" dir="rtl">{v.ar}</p>
              <p className="seo-verse-english">{v.en}</p>
            </article>
          ))}
        </section>

        {/* CTA */}
        <div className="seo-cta-section">
          <Link href={`/?surah=${surah.number}`} className="seo-cta">
            Open in Reader &rarr;
          </Link>
          <SeoPlayLink />
        </div>

        {/* All Ayah Links */}
        <section>
          <h2 className="seo-ayah-links-title">
            All {surah.ayahCount} Ayahs
          </h2>
          <div className="seo-ayah-grid">
            {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={`/surah/${slug}/${n}`} className="seo-ayah-link">
                {n}
              </Link>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <nav className="seo-nav seo-nav-surah">
          {prevSurah ? (
            <Link href={`/surah/${prevSurah.slug}`}>
              &larr; {prevSurah.englishName}
            </Link>
          ) : (
            <span className="seo-nav-disabled">&nbsp;</span>
          )}

          <Link href="/">
            All Surahs
          </Link>

          {nextSurah ? (
            <Link href={`/surah/${nextSurah.slug}`}>
              {nextSurah.englishName} &rarr;
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
