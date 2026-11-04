const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.openfurqan.app&referrer=utm_source%3Dopenfurqan.com%26utm_medium%3Dstatic-page";

/** Under Open in Reader on the surah and ayah pages. Android only for now: appBannerInitScript marks Android. */
export default function SeoPlayLink() {
  return (
    <a className="seo-play-link" href={PLAY_URL}>
      Get the Android app
    </a>
  );
}
