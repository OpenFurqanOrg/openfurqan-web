"use client";

import { useEffect, useState } from "react";
import type { NextPrayerPreview, PrayerSettings } from "./types";

type PrayerTimePayload = {
  nextPrayer?: {
    name?: string;
    display?: string;
    time?: string;
  };
};

export function useNextPrayer(prayerSettings: PrayerSettings) {
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [nextPrayerPreview, setNextPrayerPreview] = useState<NextPrayerPreview | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const interval = window.setInterval(() => setClockTick(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const hasPrayerLocation = Boolean(
    String(prayerSettings.countryCode || "").trim()
      && String(prayerSettings.city || "").trim()
  );

  useEffect(() => {
    if (!hasPrayerLocation) {
      setNextPrayerPreview(null);
      return;
    }

    const abortController = new AbortController();
    const params = new URLSearchParams({
      countryCode: String(prayerSettings.countryCode || "").trim(),
      city: String(prayerSettings.city || "").trim(),
      timezone: String(prayerSettings.timezone || "").trim(),
      method: String(prayerSettings.method || "MWL"),
      madhab: String(prayerSettings.madhab || "SHAFI")
    });

    if (Number.isFinite(prayerSettings.latitude) && Number.isFinite(prayerSettings.longitude)) {
      params.set("latitude", String(prayerSettings.latitude));
      params.set("longitude", String(prayerSettings.longitude));
    }

    const loadNextPrayer = async () => {
      try {
        const response = await fetch(`/api/prayer-times?${params.toString()}`, {
          signal: abortController.signal,
          cache: "no-store"
        });
        if (!response.ok) {
          setNextPrayerPreview(null);
          return;
        }
        const payload = (await response.json()) as PrayerTimePayload;
        const name = String(payload?.nextPrayer?.name || "").trim();
        const display = String(payload?.nextPrayer?.display || payload?.nextPrayer?.time || "").trim();
        if (!name || !display) {
          setNextPrayerPreview(null);
          return;
        }
        setNextPrayerPreview({ name, time: display });
      } catch {
        if (abortController.signal.aborted) return;
        setNextPrayerPreview(null);
      }
    };

    loadNextPrayer();

    return () => {
      abortController.abort();
    };
  }, [
    clockTick,
    hasPrayerLocation,
    prayerSettings.city,
    prayerSettings.countryCode,
    prayerSettings.latitude,
    prayerSettings.longitude,
    prayerSettings.madhab,
    prayerSettings.method,
    prayerSettings.timezone
  ]);

  return { nextPrayerPreview, hasPrayerLocation };
}
