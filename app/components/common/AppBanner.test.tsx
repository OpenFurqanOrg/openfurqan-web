import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_BANNER_DISMISSED_KEY, appBannerInitScript } from "../../lib/appBanner";
import AppBanner from "./AppBanner";
import SeoPlayLink from "./SeoPlayLink";

const ANDROID_PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

const runInitScript = (userAgent: string) => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
  new Function(appBannerInitScript)();
  return document.documentElement.dataset.appBanner;
};

describe("Android app banner", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    delete document.documentElement.dataset.appBanner;
    delete document.documentElement.dataset.android;
  });

  it("shows on Android phones and tablets", () => {
    expect(runInitScript(ANDROID_PHONE)).toBe("show");
    delete document.documentElement.dataset.appBanner;
    expect(runInitScript(ANDROID_TABLET)).toBe("show");
  });

  it("does not show on iPhones, iPads or computers", () => {
    for (const userAgent of [IPHONE, IPAD, DESKTOP]) {
      expect(runInitScript(userAgent)).toBeUndefined();
    }
  });

  it("stays closed once closed", () => {
    document.documentElement.dataset.appBanner = "show";
    render(<AppBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(document.documentElement.dataset.appBanner).toBeUndefined();
    expect(localStorage.getItem(APP_BANNER_DISMISSED_KEY)).toBe("1");
    expect(runInitScript(ANDROID_PHONE)).toBeUndefined();
  });

  it("does not show where storage is blocked, since it could not stay closed", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      }
    });
    expect(runInitScript(ANDROID_PHONE)).toBeUndefined();
  });

  it("links to the store listing, tagged as coming from the banner", () => {
    render(<AppBanner />);
    const href = screen.getByRole("link", { name: "Get OpenFurqan on Google Play" }).getAttribute("href");
    expect(href).toContain("id=com.openfurqan.app");
    expect(href).toContain("utm_medium%3Dbanner");
  });

  it("marks Android for the Play link, even with the banner closed or storage blocked", () => {
    runInitScript(ANDROID_TABLET);
    expect(document.documentElement.dataset.android).toBe("true");
    delete document.documentElement.dataset.android;

    localStorage.setItem(APP_BANNER_DISMISSED_KEY, "1");
    runInitScript(ANDROID_PHONE);
    expect(document.documentElement.dataset.android).toBe("true");
    delete document.documentElement.dataset.android;

    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      }
    });
    runInitScript(ANDROID_PHONE);
    expect(document.documentElement.dataset.android).toBe("true");
  });

  it("does not mark iPhones, iPads or computers for the Play link", () => {
    for (const userAgent of [IPHONE, IPAD, DESKTOP]) {
      runInitScript(userAgent);
      expect(document.documentElement.dataset.android).toBeUndefined();
    }
  });

  it("tags the Play link as coming from a static page", () => {
    render(<SeoPlayLink />);
    const href = screen.getByRole("link", { name: "Get the Android app" }).getAttribute("href");
    expect(href).toContain("id=com.openfurqan.app");
    expect(href).toContain("utm_medium%3Dstatic-page");
  });
});
