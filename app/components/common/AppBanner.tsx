"use client";

import Image from "next/image";
import { APP_BANNER_DISMISSED_KEY } from "../../lib/appBanner";
import { CloseIcon } from "./Icons";

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.openfurqan.app&referrer=utm_source%3Dopenfurqan.com%26utm_medium%3Dbanner";

/** A small strip at the top of the page for Android visitors; appBannerInitScript decides whether it shows. */
export default function AppBanner() {
  const close = () => {
    delete document.documentElement.dataset.appBanner;
    try {
      localStorage.setItem(APP_BANNER_DISMISSED_KEY, "1");
    } catch {
      // It stays closed until the page reloads, and the script shows nothing where storage is blocked.
    }
  };

  return (
    <section className="app-banner" aria-label="OpenFurqan for Android" data-nosnippet>
      <button type="button" className="app-banner-close" aria-label="Close" onClick={close}>
        <CloseIcon size={18} />
      </button>
      <Image className="app-banner-icon" src="/app/icon.webp" alt="" width={44} height={44} unoptimized />
      <div className="app-banner-text">
        <strong>OpenFurqan for Android</strong>
        <span>Free on Google Play, no ads</span>
      </div>
      <a className="app-banner-get" href={PLAY_URL} aria-label="Get OpenFurqan on Google Play">
        Get
      </a>
    </section>
  );
}
