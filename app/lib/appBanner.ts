export const APP_BANNER_DISMISSED_KEY = "quran_app_banner_dismissed";

/**
 * Runs in the head, before the first paint, so the page does not jump when the banner appears. It marks
 * Android phones and tablets, which is all the Play link on the surah and ayah pages needs. They also show
 * the banner until it is closed; where storage is blocked it could not stay closed, so it does not show.
 */
export const appBannerInitScript = `try{if(/Android/i.test(navigator.userAgent)){const d=document.documentElement.dataset;d.android="true";if(!localStorage.getItem(${JSON.stringify(APP_BANNER_DISMISSED_KEY)}))d.appBanner="show"}}catch{}`;
