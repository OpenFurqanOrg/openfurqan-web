"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ChapterAudioTimingSnapshot, ChapterVerseTiming } from "../../lib/types";
import { pad } from "../../lib/utils";
import type { ActivateChapterModeOptions, AudioPlayerProps, ChapterAudioData, ChapterRecitationResponse } from "./audioPlayerTypes";
import { LOCAL_TIMING_RECITER_IDS, normalizeAudioUrl, normalizeStoredWordTimings, normalizeWordSegments, parseAyahFromVerseKey, QURAN_API_RECITER_BY_LOCAL_ID } from "./audioTiming";

export function useChapterPlayback(props: AudioPlayerProps) {
  const {
  reciterId,
  reciterLabel,
  nowPlayingLabel,
  audioSrc,
  nextAudioSrc,
  isAutoPlaying,
  isAudioPaused = false,
  playbackRate = 1,
  onPlaySurah,
  onStopAutoPlay,
  onAudioEnded,
  selectedSurah,
  nowPlaying,
  showSurahControls = true,
  showPlayerBar = true,
  memorizeActive = false,
  memorizeStartAyah = 1,
  memorizeEndAyah = 1,
  memorizeLoops = 0,
  memorizeRemaining = 0,
  onWordTimingChange
} = props;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const chapterPreloadRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const recoverTimerRef = useRef<number | null>(null);
  const pausedByMediaSessionRef = useRef(false);
  const chapterModeRef = useRef(false);
  const chapterKeyRef = useRef<string | null>(null);
  const chapterCurrentAyahRef = useRef<number | null>(null);
  const chapterTimingIndexRef = useRef(0);
  const activeWordPositionRef = useRef<number | null>(null);
  const chapterSwitchingRef = useRef(false);
  const chapterCacheRef = useRef<Map<string, ChapterAudioData>>(new Map());
  const audioSrcRef = useRef<string | null>(audioSrc);
  useEffect(() => {
    audioSrcRef.current = audioSrc;
  }, [audioSrc]);

  // Keep a ref to isAutoPlaying so the ended handler can read the latest
  // value without being a stale closure — critical for background playback.
  const isAutoPlayingRef = useRef(isAutoPlaying);
  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  const memorizeActiveRef = useRef(memorizeActive);
  const memorizeStartAyahRef = useRef(memorizeStartAyah);
  const memorizeEndAyahRef = useRef(memorizeEndAyah);
  const memorizeLoopsRef = useRef(memorizeLoops);
  const memorizeRemainingRef = useRef(memorizeRemaining);
  useEffect(() => {
    memorizeActiveRef.current = memorizeActive;
    memorizeStartAyahRef.current = memorizeStartAyah;
    memorizeEndAyahRef.current = memorizeEndAyah;
    memorizeLoopsRef.current = memorizeLoops;
    memorizeRemainingRef.current = memorizeRemaining;
  }, [memorizeActive, memorizeStartAyah, memorizeEndAyah, memorizeLoops, memorizeRemaining]);

  const isAudioPausedRef = useRef(isAudioPaused);
  useEffect(() => {
    isAudioPausedRef.current = isAudioPaused;
  }, [isAudioPaused]);

  const playbackRateRef = useRef(playbackRate);
  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const nowPlayingRef = useRef(nowPlaying);
  useEffect(() => {
    nowPlayingRef.current = nowPlaying;
  }, [nowPlaying]);

  const selectedSurahRef = useRef(selectedSurah);
  useEffect(() => {
    selectedSurahRef.current = selectedSurah;
  }, [selectedSurah]);

  const emitWordTimingChange = useCallback((position: number | null) => {
    if (activeWordPositionRef.current === position) return;
    activeWordPositionRef.current = position;
    onWordTimingChange?.(position);
  }, [onWordTimingChange]);

  const disableChapterMode = useCallback(() => {
    chapterModeRef.current = false;
    chapterKeyRef.current = null;
    chapterCurrentAyahRef.current = null;
    chapterTimingIndexRef.current = 0;
    emitWordTimingChange(null);
  }, [emitWordTimingChange]);

  const getChapterCacheKey = useCallback((localReciterId: string, surahNumber: number) => {
    return `${localReciterId}:${surahNumber}`;
  }, []);

  const fetchChapterAudioData = useCallback(
    async (localReciterId: string, surahNumber: number): Promise<ChapterAudioData | null> => {
      const reciterApiId = QURAN_API_RECITER_BY_LOCAL_ID[localReciterId];
      if (!reciterApiId || !Number.isInteger(surahNumber) || surahNumber < 1) return null;

      const cacheKey = getChapterCacheKey(localReciterId, surahNumber);
      const cached = chapterCacheRef.current.get(cacheKey);
      if (cached) return cached;

      if (LOCAL_TIMING_RECITER_IDS.has(localReciterId)) {
        const localResponse = await fetch(`/api/audio-timings/${localReciterId}/${surahNumber}`);
        if (!localResponse.ok) return null;

        const localPayload = (await localResponse.json()) as ChapterAudioTimingSnapshot;
        const localAudioUrl = normalizeAudioUrl(localPayload.audioUrl);
        const localTimings: ChapterVerseTiming[] = Array.isArray(localPayload.timings)
          ? localPayload.timings
              .map((item) => {
                const ayah = Number(item?.ayah);
                const fromMs = Number(item?.fromMs);
                const toMs = Number(item?.toMs);
                if (
                  !Number.isInteger(ayah)
                  || ayah < 1
                  || !Number.isFinite(fromMs)
                  || !Number.isFinite(toMs)
                  || toMs < fromMs
                ) {
                  return null;
                }

                return {
                  ayah,
                  fromMs,
                  toMs,
                  words: normalizeStoredWordTimings(localReciterId, surahNumber, ayah, item?.words)
                };
              })
              .filter((item): item is ChapterVerseTiming => item !== null)
          : [];

        if (!localAudioUrl || !localTimings.length) return null;

        const byAyah = new Map<number, ChapterVerseTiming>();
        for (const timing of localTimings) {
          byAyah.set(timing.ayah, timing);
        }

        const chapterData: ChapterAudioData = {
          audioUrl: localAudioUrl,
          timings: localTimings,
          byAyah
        };

        chapterCacheRef.current.set(cacheKey, chapterData);
        return chapterData;
      }

      const response = await fetch(
        `https://api.quran.com/api/v4/chapter_recitations/${reciterApiId}/${surahNumber}?segments=true`
      );
      if (!response.ok) return null;

      const payload = (await response.json()) as ChapterRecitationResponse;
      const rawAudioUrl = normalizeAudioUrl(payload.audio_file?.audio_url);
      const rawTimestamps = payload.audio_file?.timestamps || [];
      if (!rawAudioUrl || !rawTimestamps.length) return null;

      const timings: ChapterVerseTiming[] = rawTimestamps
        .map((item) => {
          const ayah = parseAyahFromVerseKey(item.verse_key);
          const fromMs = Number(item.timestamp_from);
          const toMs = Number(item.timestamp_to);
          if (!ayah || !Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
            return null;
          }
          return {
            ayah,
            fromMs,
            toMs,
            words: normalizeWordSegments(item.segments)
          };
        })
        .filter((item): item is ChapterVerseTiming => item !== null);

      if (!timings.length) return null;

      const byAyah = new Map<number, ChapterVerseTiming>();
      for (const timing of timings) {
        byAyah.set(timing.ayah, timing);
      }

      const chapterData: ChapterAudioData = {
        audioUrl: rawAudioUrl,
        timings,
        byAyah
      };

      chapterCacheRef.current.set(cacheKey, chapterData);
      return chapterData;
    },
    [getChapterCacheKey]
  );

  const resolveAyahAtTimestamp = useCallback((data: ChapterAudioData, currentTimeMs: number): number | null => {
    if (!data.timings.length) return null;

    let index = chapterTimingIndexRef.current;
    if (index < 0 || index >= data.timings.length) index = 0;

    while (index + 1 < data.timings.length && currentTimeMs > data.timings[index].toMs) {
      index += 1;
    }
    while (index > 0 && currentTimeMs < data.timings[index].fromMs) {
      index -= 1;
    }

    const current = data.timings[index];
    const inRange = currentTimeMs >= current.fromMs && currentTimeMs <= current.toMs;
    if (!inRange) {
      const fallbackIndex = data.timings.findIndex(
        (item) => currentTimeMs >= item.fromMs && currentTimeMs <= item.toMs
      );
      if (fallbackIndex < 0) return null;
      chapterTimingIndexRef.current = fallbackIndex;
      return data.timings[fallbackIndex]?.ayah || null;
    }

    chapterTimingIndexRef.current = index;
    return current.ayah;
  }, []);

  const resolveWordAtTimestamp = useCallback((timing: ChapterVerseTiming | undefined, currentTimeMs: number) => {
    if (!timing?.words?.length) return null;

    const inRange = timing.words.find(
      (word) => currentTimeMs >= word.fromMs && currentTimeMs <= word.toMs
    );
    if (inRange) return inRange.position;

    let fallback: number | null = null;
    for (const word of timing.words) {
      if (currentTimeMs >= word.fromMs) {
        fallback = word.position;
        continue;
      }
      break;
    }

    return fallback;
  }, []);

  const activateChapterMode = useCallback(
    async ({
      preserveAyahProgress,
      allowWhileVisible = false,
      targetAyah
    }: ActivateChapterModeOptions): Promise<boolean> => {
      if (chapterSwitchingRef.current) return false;
      if (memorizeActiveRef.current) return false;
      if (
        typeof document === "undefined"
        || (!allowWhileVisible && document.visibilityState === "visible")
      ) {
        return false;
      }
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return false;

      const currentNowPlaying = nowPlayingRef.current;
      const audio = audioRef.current;
      if (!audio || !currentNowPlaying) return false;
      const targetAyahNumber = Number.isInteger(targetAyah) && Number(targetAyah) > 0
        ? Number(targetAyah)
        : currentNowPlaying.ayah;

      chapterSwitchingRef.current = true;
      emitWordTimingChange(null);
      try {
        const chapterData = await fetchChapterAudioData(reciterId, currentNowPlaying.surah);
        if (!chapterData) return false;
        // Repeat/memorization may have been enabled while chapter metadata was
        // loading. Do not let the completed request replace the ayah audio.
        if (memorizeActiveRef.current) return false;

        const currentAyahTiming = chapterData.byAyah.get(targetAyahNumber);
        if (!currentAyahTiming) return false;

        const ayahElapsedMs = preserveAyahProgress ? Math.max(0, Math.floor(audio.currentTime * 1000)) : 0;
        const desiredMs = Math.min(
          Math.max(currentAyahTiming.fromMs, currentAyahTiming.fromMs + ayahElapsedMs),
          Math.max(currentAyahTiming.fromMs, currentAyahTiming.toMs - 120)
        );
        const desiredSeconds = desiredMs / 1000;
        const canFastStartFromBeginning = targetAyahNumber === 1 && desiredSeconds <= 0.12;

        if (audio.src !== chapterData.audioUrl) {
          audio.src = chapterData.audioUrl;
          if (!canFastStartFromBeginning) {
            audio.load();
            await new Promise<void>((resolve) => {
              const timeoutId = window.setTimeout(resolve, 1400);
              const onLoaded = () => {
                window.clearTimeout(timeoutId);
                resolve();
              };
              audio.addEventListener("loadedmetadata", onLoaded, { once: true });
            });
          }
        }

        if (!canFastStartFromBeginning) {
          try {
            audio.currentTime = desiredSeconds;
          } catch {
            // ignore seek errors
          }
        }

        audio.playbackRate = playbackRateRef.current;
        await audio.play().catch(() => undefined);

        const cacheKey = getChapterCacheKey(reciterId, currentNowPlaying.surah);
        chapterModeRef.current = true;
        chapterKeyRef.current = cacheKey;
        chapterCurrentAyahRef.current = targetAyahNumber;
        const timingIndex = chapterData.timings.findIndex((item) => item.ayah === targetAyahNumber);
        chapterTimingIndexRef.current = timingIndex >= 0 ? timingIndex : 0;
        retryCountRef.current = 0;

        return true;
      } catch {
        return false;
      } finally {
        chapterSwitchingRef.current = false;
      }
    },
    [emitWordTimingChange, fetchChapterAudioData, getChapterCacheKey, reciterId]
  );

  const getNextSrcFromCurrent = useCallback((currentSrc: string) => {
    const match = currentSrc.match(/(\d{3})(\d{3})\.mp3(?:\?.*)?$/);
    if (!match) return null;

    const surah = Number.parseInt(match[1] || "0", 10);
    const ayah = Number.parseInt(match[2] || "0", 10);
    if (!Number.isInteger(surah) || !Number.isInteger(ayah) || surah < 1 || ayah < 1) {
      return null;
    }

    // Guard against requesting past the selected surah boundary.
    const currentSelectedSurah = selectedSurahRef.current;
    if (currentSelectedSurah?.number === surah && ayah >= currentSelectedSurah.numberOfAyahs) {
      return null;
    }

    return currentSrc.replace(/\d{6}\.mp3(?:\?.*)?$/, `${pad(surah)}${pad(ayah + 1)}.mp3`);
  }, []);

  return {
    reciterId,
    reciterLabel,
    nowPlayingLabel,
    audioSrc,
    nextAudioSrc,
    isAutoPlaying,
    isAudioPaused,
    playbackRate,
    onPlaySurah,
    onStopAutoPlay,
    onAudioEnded,
    selectedSurah,
    nowPlaying,
    showSurahControls,
    showPlayerBar,
    memorizeActive,
    memorizeStartAyah,
    memorizeEndAyah,
    memorizeLoops,
    memorizeRemaining,
    onWordTimingChange,
    audioRef,
    preloadRef,
    chapterPreloadRef,
    retryCountRef,
    recoverTimerRef,
    pausedByMediaSessionRef,
    chapterModeRef,
    chapterKeyRef,
    chapterCurrentAyahRef,
    chapterTimingIndexRef,
    activeWordPositionRef,
    chapterSwitchingRef,
    chapterCacheRef,
    audioSrcRef,
    isAutoPlayingRef,
    memorizeActiveRef,
    memorizeStartAyahRef,
    memorizeEndAyahRef,
    memorizeLoopsRef,
    memorizeRemainingRef,
    isAudioPausedRef,
    playbackRateRef,
    nowPlayingRef,
    selectedSurahRef,
    emitWordTimingChange,
    disableChapterMode,
    getChapterCacheKey,
    fetchChapterAudioData,
    resolveAyahAtTimestamp,
    resolveWordAtTimestamp,
    activateChapterMode,
    getNextSrcFromCurrent,
  };
}

export type AudioPlaybackRuntime = ReturnType<typeof useChapterPlayback>;
