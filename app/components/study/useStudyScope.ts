"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "../../lib/apiClient";
import type { MushafPageLayout } from "./StudyModeTypes";
import type { StudyScopeAyah, StudyScopeResponse } from "./StudyScopeTypes";

export default function useStudyScope(studyScopeMode: "surah" | "juz" | "page", activeScopeValue: number, translationKey: string, showStudyTransliteration: boolean) {
  const [scopedAyahs, setScopedAyahs] = useState<StudyScopeAyah[]>([]);
  const [scopeMeta, setScopeMeta] = useState<StudyScopeResponse["scope"] | null>(null);
  const [scopeLayout, setScopeLayout] = useState<MushafPageLayout | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);

  useEffect(() => {
    if (studyScopeMode === "surah") {
      setScopeLoading(false);
      setScopeError(null);
      setScopeMeta(null);
      setScopeLayout(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (translationKey) {
      params.set("translations", translationKey);
    }
    if (showStudyTransliteration && studyScopeMode === "juz") {
      params.set("transliteration", "1");
    }

    const url = `/api/${studyScopeMode}/${activeScopeValue}${params.toString() ? `?${params.toString()}` : ""}`;
    const cacheKey = `study-scope:v3:${studyScopeMode}:${activeScopeValue}:${translationKey}:${showStudyTransliteration ? 1 : 0}`;

    setScopeLoading(true);
    setScopeError(null);

    fetchJSON<StudyScopeResponse>(url, {
      ttl: 30 * 60 * 1000,
      retries: 1,
      retryDelay: 300,
      persist: true,
      staleWhileRevalidate: true,
      cacheKey,
      signal: controller.signal
    })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setScopedAyahs(Array.isArray(payload?.ayahs) ? payload.ayahs : []);
        setScopeMeta(payload?.scope || null);
        setScopeLayout(payload?.layout || null);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Failed to load study scope.";
        setScopeError(message);
        setScopedAyahs([]);
        setScopeMeta(null);
        setScopeLayout(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setScopeLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    activeScopeValue,
    showStudyTransliteration,
    studyScopeMode,
    translationKey
  ]);

  return { scopedAyahs, scopeMeta, scopeLayout, scopeLoading, scopeError };
}
