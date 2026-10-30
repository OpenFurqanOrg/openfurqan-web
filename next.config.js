const isProd = process.env.NODE_ENV === "production";

/* A fixed policy (no per-request nonce) so pages can be prerendered at build
   time and served from the CDN without running a function. Next.js's inline
   bootstrap scripts then need 'unsafe-inline'. */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://verses.quran.foundation https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://vitals.vercel-insights.com https://api.quran.com",
  "media-src 'self' https://everyayah.com https://audio.qurancdn.com https://download.quranicaudio.com",
  "worker-src 'self'",
  "manifest-src 'self'"
].join("; ");

const CANONICAL_ORIGIN = "https://openfurqan.com";
const LEGACY_PRODUCTION_HOSTS = ["www.openfurqan.com"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/fonts/qcf-v2/*": ["./.openfurqan-data/current/fonts/qcf-v2/*.woff2"],
    "/api/surah/*": ["./.openfurqan-data/current/quran-text.json", "./.openfurqan-data/current/translations/*.json"],
    "/api/ayah/*": ["./.openfurqan-data/current/translations/*.json"],
    "/api/page/*": ["./.openfurqan-data/current/quran-metadata-*.json", "./.openfurqan-data/current/quran-page-layouts/*.json", "./.openfurqan-data/current/translations/*.json"],
    "/api/juz/*": ["./.openfurqan-data/current/quran-metadata-*.json", "./.openfurqan-data/current/translations/*.json"],
    "/api/memorization/deck": ["./.openfurqan-data/current/quran-metadata-*.json", "./.openfurqan-data/current/quran-words.json", "./.openfurqan-data/current/quran-morphology.mustafa.txt", "./.openfurqan-data/current/translations/*.json"],
    "/api/search": ["./.openfurqan-data/current/quran-search-index.json", "./.openfurqan-data/current/quran-metadata-surah-name.json"],
    "/api/tafsir": ["./.openfurqan-data/current/tafsir/**/*.json", "./.openfurqan-data/current/translations/*.json"],
    "/api/words/*": ["./.openfurqan-data/current/quran-words.json", "./.openfurqan-data/current/quran-morphology.mustafa.txt"],
    "/api/audio-timings/*/*": ["./.openfurqan-data/current/audio-timings/**/*.json"],
    "/api/lexicon/root/*": ["./.openfurqan-data/current/root-explorer/*.json", "./.openfurqan-data/current/lane-lexicon.json", "./.openfurqan-data/current/root-meanings.*.json", "./.openfurqan-data/current/quran-morphology.mustafa.txt"],
    "/surah/**": ["./.openfurqan-data/current/quran-seo/*.json"]
  },
  outputFileTracingExcludes: {
    "/*": ["./.openfurqan-data/bundles/**", "./.openfurqan-data/current/raw/**", "./.openfurqan-data/previous-*/**", "./.openfurqan-data/staging-*/**", "./.migration-evidence/**"]
  },
  redirects: async () => [
    ...LEGACY_PRODUCTION_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: /** @type {const} */ ("host"), value: host }],
      destination: `${CANONICAL_ORIGIN}/:path*`,
      permanent: true
    })),
    // Locale prefixes all collapse to the English root. The bare prefixes must
    // come first: "/en/:path*" also matches "/en" and yields an empty Location.
    ...["en", "bn", "ur"].flatMap((locale) => [
      {
        source: `/${locale}`,
        destination: "/",
        permanent: true
      },
      {
        source: `/${locale}/:path*`,
        destination: "/:path*",
        permanent: true
      }
    ])
  ],
  headers: async () => {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" }
    ];

    if (isProd) {
      headers.push(
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        },
        { key: "Content-Security-Policy", value: contentSecurityPolicy }
      );
    }

    return [
      {
        source: "/(.*)",
        headers
      }
    ];
  }
};

export default nextConfig;
