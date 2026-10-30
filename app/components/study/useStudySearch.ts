"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJSON } from "../../lib/apiClient";
import { SURAH_AYAH_COUNTS } from "../../lib/constants";

type SearchResult = {
  surah?: number;
  ayah?: number;
  text?: string;
  translation?: string;
};

export default function useStudySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHasRun, setSearchHasRun] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
    };
  }, []);

  const parseDirectVerseReference = useCallback((rawQuery: string) => {
    const normalized = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalized) return null;

    const match =
      normalized.match(/^(\d{1,3})\s*[:./-]\s*(\d{1,3})$/)
      || normalized.match(/^surah\s*(\d{1,3})\s*ayah\s*(\d{1,3})$/);

    if (!match) return null;
    const surah = Number(match[1]);
    const ayah = Number(match[2]);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
    if (!Number.isInteger(ayah) || ayah < 1) return null;

    const maxAyah = SURAH_AYAH_COUNTS[surah - 1] || 0;
    if (!maxAyah || ayah > maxAyah) return null;

    return { surah, ayah };
  }, []);

  const runSearch = useCallback(async () => {
    const query = searchQuery.trim().replace(/\s+/g, " ");
    if (!query) {
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      setSearchError(null);
      setSearchResults([]);
      setSearchLoading(false);
      setSearchHasRun(false);
      return;
    }

    setSearchHasRun(true);

    const directRef = parseDirectVerseReference(query);
    if (directRef) {
      setSearchError(null);
      setSearchResults([
        {
          surah: directRef.surah,
          ayah: directRef.ayah,
          text: "",
          translation: `Direct verse match (${directRef.surah}:${directRef.ayah})`
        }
      ]);
      setSearchLoading(false);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const payload = await fetchJSON<{ results?: SearchResult[] }>(
        `/api/search?q=${encodeURIComponent(query)}`,
        {
          ttl: 2 * 60 * 1000,
          retries: 1,
          retryDelay: 250,
          cacheKey: `study-search:${query.toLowerCase()}`,
          signal: controller.signal
        }
      );
      if (searchAbortRef.current !== controller) return;
      setSearchResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      if (searchAbortRef.current !== controller) return;
      const message = error instanceof Error ? error.message : "Search failed.";
      setSearchError(message);
      setSearchResults([]);
    } finally {
      if (searchAbortRef.current === controller) {
        setSearchLoading(false);
        searchAbortRef.current = null;
      }
    }
  }, [parseDirectVerseReference, searchQuery]);

  return { searchQuery, setSearchQuery, searchResults, searchLoading, searchError, searchHasRun, runSearch };
}
