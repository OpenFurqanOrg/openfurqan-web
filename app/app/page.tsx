import Image from "next/image";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import PhoneVideo from "./PhoneVideo";

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.openfurqan.app&referrer=utm_source%3Dopenfurqan.com%26utm_medium%3Dapp-page";
const PAGE_URL = "https://openfurqan.com/app";
const CONTACT = "contact@openfurqan.com";
const DESCRIPTION =
  "OpenFurqan is a free Quran app for Android with no ads, no account and no tracking: the 604-page Mushaf, translations in 75 languages, 44 tafsirs, word-by-word meanings, 16 reciters and memorization.";

export const metadata: Metadata = {
  title: { absolute: "OpenFurqan for Android — Free Quran App with Tafsir and Word-by-Word Meanings" },
  description: DESCRIPTION,
  alternates: { canonical: "/app" },
  openGraph: {
    title: "OpenFurqan: Quran App for Android",
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "OpenFurqan",
    type: "website",
    images: [{ url: "/app/og.png", width: 1024, height: 500, alt: "OpenFurqan: Read. Study. Memorize." }]
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFurqan: Quran App for Android",
    description: DESCRIPTION,
    images: ["/app/og.png"]
  }
};

export const viewport: Viewport = { themeColor: "#f5f5f7" };

const STORIES = [
  {
    video: "word",
    label: "Tapping a word in Al-Fatihah to see its meaning, its root and the root across the Quran",
    eyebrow: "Understand",
    title: "Every word, down to its root.",
    body: "Tap any word for its meaning, grammar and root. Then follow the root through the Quran: every form it takes, every ayah it appears in, and its entry in Lane's Lexicon."
  },
  {
    video: "panel",
    label: "Reading Maarif-ul-Quran and then a hadith beside an ayah of Al-Fatihah",
    eyebrow: "Tafsir and hadith",
    title: "Go deeper, without leaving the ayah.",
    body: "Open any ayah for 44 tafsirs, from Ibn Kathir to Maarif-ul-Quran, and the hadith that speak of it, from Sahih al-Bukhari, Sahih Muslim and more."
  },
  {
    video: "meaning",
    label: "Reviewing the words of Al-Fatihah one at a time",
    eyebrow: "Memorize",
    title: "Learn it by heart, and keep it.",
    body: "Recite from memory and check yourself word by word. Each ayah and each word comes back for review just when you need it, so what you learn stays."
  },
  {
    video: "themes",
    label: "Switching between light and dark themes",
    eyebrow: "Make it yours",
    title: "Calm themes, light and dark.",
    body: "Choose a theme, an Arabic font and tajweed colours that keep your eyes on the page, by day and by night."
  }
];

const NUMBERS = [
  ["604", "Mushaf pages"],
  ["75", "translation languages"],
  ["44", "tafsirs"],
  ["16", "reciters"],
  ["1,651", "Quranic roots"]
];

const QUESTIONS = [
  {
    q: "Is OpenFurqan free?",
    a: "Yes. There are no ads, no subscriptions and no in-app purchases."
  },
  {
    q: "Does it work offline?",
    a: "Yes. The Quran text, the main translations and most study tools are built into the app. Tafsirs and recitations download the first time you open them and then stay on your phone."
  },
  {
    q: "Which languages is it in?",
    a: "The app is in English, Bangla, Hindi and Urdu, with Quran translations in 75 languages."
  },
  {
    q: "Is there an iPhone app?",
    a: "Not yet. On an iPhone, an iPad or a computer, use the web version at openfurqan.com."
  },
  {
    q: "Where is my data kept?",
    a: "Only on your phone. There is no account, and your notes, recordings and progress are never uploaded."
  }
];

/** Google's own badge, as Google provides it, linking to the store listing. */
function PlayButton() {
  return (
    <a className="ap-badge" href={PLAY_URL}>
      <Image src="/app/google-play-badge.svg" alt="Get it on Google Play" width={239} height={71} unoptimized />
    </a>
  );
}

export default function AppPage() {
  // The hero's first frame is the largest thing on first paint: fetch it before the rest.
  preload("/app/reader.webp", { as: "image", fetchPriority: "high" });
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "OpenFurqan: Quran App",
    alternateName: "OpenFurqan",
    description: DESCRIPTION,
    url: PAGE_URL,
    installUrl: "https://play.google.com/store/apps/details?id=com.openfurqan.app",
    operatingSystem: "Android 7.0 or later",
    applicationCategory: "EducationalApplication",
    inLanguage: ["en", "bn", "hi", "ur"],
    image: "https://openfurqan.com/app/icon.webp",
    screenshot: ["reader", ...STORIES.map((story) => story.video)].map((name) => `https://openfurqan.com/app/${name}.webp`),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "OpenFurqan", url: "https://openfurqan.com", email: CONTACT }
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QUESTIONS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  return (
    <main className="app-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="ap-nav" aria-label="OpenFurqan">
        <div className="ap-nav-inner">
          <Link className="ap-brand" href="/app">
            <Image src="/app/icon.webp" alt="" width={28} height={28} priority unoptimized />
            OpenFurqan
          </Link>
          <a className="ap-nav-button" href={PLAY_URL}>
            Get the app
          </a>
        </div>
      </nav>

      <header className="ap-hero">
        <h1 className="ap-display">
          The Quran,
          <br />
          calm and clear.
        </h1>
        <p className="ap-lead">Read, listen, study and memorize. Free on Android, with no ads.</p>
        <div className="ap-actions">
          <PlayButton />
        </div>
        <div className="ap-hero-phone">
          <PhoneVideo name="reader" label="Reading Al-Fatihah in Arabic with Mufti Taqi Usmani's translation" />
        </div>
      </header>

      {STORIES.map((story) => (
        <section key={story.video} className="ap-story" aria-labelledby={`ap-${story.video}`}>
          <div className="ap-story-text" data-reveal>
            <p className="ap-eyebrow">{story.eyebrow}</p>
            <h2 id={`ap-${story.video}`} className="ap-title">
              {story.title}
            </h2>
            <p className="ap-body">{story.body}</p>
          </div>
          <div className="ap-story-phone" data-reveal>
            <PhoneVideo name={story.video} label={story.label} />
          </div>
        </section>
      ))}

      <section className="ap-band" aria-labelledby="ap-listen">
        <div className="ap-band-inner" data-reveal>
          <p className="ap-eyebrow">Listen</p>
          <h2 id="ap-listen" className="ap-title">
            16 reciters. The words follow along.
          </h2>
          <p className="ap-body ap-center">
            Mishary Alafasy, Abdul Basit, Al-Husary, Al-Minshawi and more. The text follows the recitation, most of it
            word by word. Repeat an ayah until it stays, and keep listening in the background.
          </p>
        </div>
        <dl className="ap-numbers" data-reveal>
          {NUMBERS.map(([value, label]) => (
            <div key={label}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ap-private" aria-labelledby="ap-private">
        <div data-reveal>
          <h2 id="ap-private" className="ap-title">
            Yours alone.
          </h2>
          <p className="ap-body ap-center">
            No account. No ads. No tracking. Your notes, bookmarks, recordings and progress stay on your phone, and the
            Quran and its main translations work offline.
          </p>
          <Link className="ap-text-link" href="/privacy">
            Read the privacy policy <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      <section className="ap-questions" aria-labelledby="ap-questions">
        <h2 id="ap-questions" className="ap-title">
          Questions
        </h2>
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="ap-question">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="ap-closing" aria-labelledby="ap-begin">
        <div data-reveal>
          <Image className="ap-closing-icon" src="/app/icon.webp" alt="" width={88} height={88} unoptimized />
          <h2 id="ap-begin" className="ap-title">
            Begin reading.
          </h2>
          <PlayButton />
          <p className="ap-fine">
            Free on Android 7 and newer. On an iPhone or a computer,{" "}
            <Link className="ap-text-link ap-fine-link" href="/">
              use the web version
            </Link>
            .
          </p>
        </div>
      </section>

      <footer className="ap-footer">
        <Link href="/privacy">Privacy policy</Link>
        <a href="https://github.com/OpenFurqanOrg/openfurqan-android">Release notes</a>
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        <Link href="/">Web version</Link>
      </footer>
    </main>
  );
}
