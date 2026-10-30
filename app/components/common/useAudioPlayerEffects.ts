"use client";

import { useEffect } from "react";
import { pad } from "../../lib/utils";
import { QURAN_API_RECITER_BY_LOCAL_ID } from "./audioTiming";
import type { AudioPlaybackRuntime } from "./useChapterPlayback";

export function useAudioPlayerEffects(runtime: AudioPlaybackRuntime) {
  const {
    reciterId,
    reciterLabel,
    nowPlayingLabel,
    audioSrc,
    nextAudioSrc,
    isAutoPlaying,
    isAudioPaused,
    playbackRate,
    onStopAutoPlay,
    onAudioEnded,
    selectedSurah,
    nowPlaying,
    memorizeActive,
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
    emitWordTimingChange,
    disableChapterMode,
    getChapterCacheKey,
    fetchChapterAudioData,
    resolveAyahAtTimestamp,
    resolveWordAtTimestamp,
    activateChapterMode,
    getNextSrcFromCurrent,
  } = runtime;
  // Wire up the ended event once — the audio element is never remounted.
  // When backgrounded, React state updates are throttled by the browser, so
  // we CANNOT rely on the audioSrc prop updating after onAudioEnded(). Instead,
  // we advance the audio element imperatively by parsing the current URL and
  // computing the next ayah ourselves. This keeps audio alive in the background.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      emitWordTimingChange(null);
      retryCountRef.current = 0;
      if (isAutoPlayingRef.current && memorizeActiveRef.current) {
        // Keep memorize/repeat in ayah mode so repeat boundaries are exact.
        if (chapterModeRef.current) {
          disableChapterMode();
        }

        const match = (audio.currentSrc || audio.src).match(/(\d{3})(\d{3})\.mp3(?:\?.*)?$/);
        if (match) {
          const surah = Number.parseInt(match[1] || "0", 10);
          const ayah = Number.parseInt(match[2] || "0", 10);
          const nextAyah = ayah + 1;
          const atRangeEnd = nextAyah > memorizeEndAyahRef.current;

          if (atRangeEnd) {
            // Check if loops are exhausted (loops > 0 means finite, remaining <= 1 means last)
            const loops = memorizeLoopsRef.current;
            const remaining = memorizeRemainingRef.current;
            if (loops > 0 && remaining <= 1) {
              // Done looping — let onAudioEnded() handle cleanup, don't play next
              onAudioEnded();
              return;
            }
          }

          // Still within range or looping back to start
          const targetAyah = atRangeEnd
            ? memorizeStartAyahRef.current
            : nextAyah;
          const targetSrc = (audio.currentSrc || audio.src).replace(
            /\d{6}\.mp3(?:\?.*)?$/,
            `${pad(surah)}${pad(targetAyah)}.mp3`
          );
          const currentSrc = audio.currentSrc || audio.src;
          if (currentSrc === targetSrc) {
            audio.currentTime = 0;
          } else {
            audio.src = targetSrc;
          }
          audio.playbackRate = playbackRateRef.current;
          audio.play().catch(() => {});
        }
        onAudioEnded();
        return;
      }

      if (isAutoPlayingRef.current && chapterModeRef.current) {
        disableChapterMode();
        onStopAutoPlay();
        return;
      }

      if (isAutoPlayingRef.current) {
        const nextSrc = getNextSrcFromCurrent(audio.currentSrc || audio.src);
        if (nextSrc) {
          // No load() — avoids a spurious pause event that triggers the recovery
          // timer and creates a gap that can break the iOS audio session.
          // Setting src + play() is sufficient; the browser loads the new src.
          audio.src = nextSrc;
          audio.playbackRate = playbackRateRef.current;
          audio.play().catch(() => {});
        }
      }
      // Also notify React so it can update UI state (nowPlaying, scroll, etc.)
      onAudioEnded();
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [audioRef, chapterModeRef, disableChapterMode, emitWordTimingChange, getNextSrcFromCurrent, isAutoPlayingRef, memorizeActiveRef, memorizeEndAyahRef, memorizeLoopsRef, memorizeRemainingRef, memorizeStartAyahRef, onAudioEnded, onStopAutoPlay, playbackRateRef, retryCountRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!chapterModeRef.current) return;
      const cacheKey = chapterKeyRef.current;
      if (!cacheKey) return;

      const chapterData = chapterCacheRef.current.get(cacheKey);
      if (!chapterData) {
        emitWordTimingChange(null);
        return;
      }

      const currentTimeMs = Math.floor(audio.currentTime * 1000);
      const ayahAtTime = resolveAyahAtTimestamp(chapterData, currentTimeMs);
      if (!ayahAtTime) {
        emitWordTimingChange(null);
        return;
      }

      const currentTiming = chapterData.byAyah.get(ayahAtTime);
      emitWordTimingChange(resolveWordAtTimestamp(currentTiming, currentTimeMs));

      const trackedAyah = chapterCurrentAyahRef.current;
      if (!trackedAyah) {
        chapterCurrentAyahRef.current = ayahAtTime;
        return;
      }

      if (ayahAtTime > trackedAyah) {
        chapterCurrentAyahRef.current = trackedAyah + 1;
        onAudioEnded();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [audioRef, chapterCacheRef, chapterCurrentAyahRef, chapterKeyRef, chapterModeRef, emitWordTimingChange, onAudioEnded, resolveAyahAtTimestamp, resolveWordAtTimestamp]);

  useEffect(() => {
    if (isAudioPaused || !isAutoPlaying || !chapterModeRef.current) {
      emitWordTimingChange(null);
    }
  }, [chapterModeRef, emitWordTimingChange, isAudioPaused, isAutoPlaying]);

  // Background resilience: recover from network/decoder stalls while autoplaying.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const clearRecoveryTimer = () => {
      if (recoverTimerRef.current !== null) {
        window.clearTimeout(recoverTimerRef.current);
        recoverTimerRef.current = null;
      }
    };

    const tryRecovery = () => {
      if (recoverTimerRef.current !== null) return;
      recoverTimerRef.current = window.setTimeout(() => {
        recoverTimerRef.current = null;
        const node = audioRef.current;
        if (!node) return;
        if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
        if (!node.paused && !node.error) return;

        if (document.visibilityState !== "visible") {
          void activateChapterMode({ preserveAyahProgress: true }).then((activated) => {
            if (activated) return;

            const hiddenCurrentSrc = node.currentSrc || node.src;
            if (!hiddenCurrentSrc) return;

            if (retryCountRef.current < 1) {
              retryCountRef.current += 1;
              node.load();
              node.playbackRate = playbackRateRef.current;
              node.play().catch(() => {});
              return;
            }

            const hiddenNextSrc = getNextSrcFromCurrent(hiddenCurrentSrc);
            if (!hiddenNextSrc) return;
            retryCountRef.current = 0;
            node.src = hiddenNextSrc;
            node.load();
            node.playbackRate = playbackRateRef.current;
            node.play().catch(() => {});
            onAudioEnded();
          });
          return;
        }

        const currentSrc = node.currentSrc || node.src;
        if (!currentSrc) return;

        // One retry for the same verse before skipping to the next one.
        if (retryCountRef.current < 1) {
          retryCountRef.current += 1;
          node.load();
          node.playbackRate = playbackRateRef.current;
          node.play().catch(() => {
            const nextSrc = getNextSrcFromCurrent(currentSrc);
            if (!nextSrc) return;
            node.src = nextSrc;
            node.load();
            node.playbackRate = playbackRateRef.current;
            node.play().catch(() => {});
            onAudioEnded();
          });
          return;
        }

        const nextSrc = getNextSrcFromCurrent(currentSrc);
        if (!nextSrc) return;
        retryCountRef.current = 0;
        node.src = nextSrc;
        node.load();
        node.playbackRate = playbackRateRef.current;
        node.play().catch(() => {});
        onAudioEnded();
      }, 420);
    };

    const handleStall = () => {
      if (chapterSwitchingRef.current) return;
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      tryRecovery();
    };

    const handlePause = () => {
      if (chapterSwitchingRef.current) return;
      if (pausedByMediaSessionRef.current) return;
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      if (audio.ended) return;
      tryRecovery();
    };

    const handlePlaying = () => {
      retryCountRef.current = 0;
      clearRecoveryTimer();
    };

    audio.addEventListener("stalled", handleStall);
    audio.addEventListener("error", handleStall);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      clearRecoveryTimer();
      audio.removeEventListener("stalled", handleStall);
      audio.removeEventListener("error", handleStall);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [activateChapterMode, audioRef, chapterSwitchingRef, getNextSrcFromCurrent, isAudioPausedRef, isAutoPlayingRef, onAudioEnded, pausedByMediaSessionRef, playbackRateRef, recoverTimerRef, retryCountRef]);

  useEffect(() => {
    if (isAutoPlaying) return;
    pausedByMediaSessionRef.current = false;
    disableChapterMode();
  }, [disableChapterMode, isAutoPlaying, pausedByMediaSessionRef]);

  useEffect(() => {
    if (!memorizeActive) return;

    // Memorization and Reader repeat require an individual ayah file so the
    // native `ended` event fires at the exact repeat boundary. Chapter mode
    // uses one long surah file and therefore cannot repeat a single ayah.
    disableChapterMode();

    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    pausedByMediaSessionRef.current = false;
    retryCountRef.current = 0;
    if (audio.src !== audioSrc) {
      audio.src = audioSrc;
      audio.load();
    }
    audio.playbackRate = playbackRateRef.current;

    if (isAutoPlaying && !isAudioPaused && audio.paused) {
      audio.play().catch(() => {});
    }
  }, [audioRef, audioSrc, disableChapterMode, isAudioPaused, isAutoPlaying, memorizeActive, pausedByMediaSessionRef, playbackRateRef, retryCountRef]);

  // Primary autoplay strategy (Quran.com-like): use chapter stream + verse timestamps.
  // Keep ayah-by-ayah playback as fallback when no chapter recitation mapping exists.
  useEffect(() => {
    if (!isAutoPlaying || !nowPlaying) return;

    if (memorizeActive) {
      disableChapterMode();
      return;
    }

    const cacheKey = getChapterCacheKey(reciterId, nowPlaying.surah);
    const supportsChapterMode = Boolean(QURAN_API_RECITER_BY_LOCAL_ID[reciterId]);

    if (!supportsChapterMode) {
      disableChapterMode();
      return;
    }

    if (!chapterModeRef.current || chapterKeyRef.current !== cacheKey) {
      void activateChapterMode({
        preserveAyahProgress: false,
        allowWhileVisible: true,
        targetAyah: nowPlaying.ayah
      }).then((activated) => {
        if (activated) return;

        const audio = audioRef.current;
        const fallbackSrc = audioSrcRef.current;
        if (!audio || !fallbackSrc) return;
        if (chapterModeRef.current || chapterSwitchingRef.current) return;

        if (audio.src !== fallbackSrc) {
          audio.src = fallbackSrc;
          audio.load();
        }

        audio.playbackRate = playbackRateRef.current;
        if (audio.paused && !isAudioPausedRef.current && !pausedByMediaSessionRef.current) {
          audio.play().catch(() => {});
        }
      });
      return;
    }

    const chapterData = chapterCacheRef.current.get(cacheKey);
    const audio = audioRef.current;
    if (!chapterData || !audio) return;

    const ayahTiming = chapterData.byAyah.get(nowPlaying.ayah);
    if (!ayahTiming) return;

    const currentMs = Math.floor(audio.currentTime * 1000);
    const seekToleranceMs = 900;
    const outsideTargetAyah =
      currentMs < ayahTiming.fromMs - seekToleranceMs || currentMs > ayahTiming.toMs + seekToleranceMs;

    if (!outsideTargetAyah) return;

    try {
      audio.currentTime = (ayahTiming.fromMs + 100) / 1000;
    } catch {
      // ignore seek errors
    }

    audio.playbackRate = playbackRateRef.current;
    if (audio.paused && !isAudioPausedRef.current && !pausedByMediaSessionRef.current) {
      audio.play().catch(() => {});
    }

    chapterCurrentAyahRef.current = nowPlaying.ayah;
    const index = chapterData.timings.findIndex((item) => item.ayah === nowPlaying.ayah);
    chapterTimingIndexRef.current = index >= 0 ? index : 0;
  }, [activateChapterMode, audioRef, audioSrcRef, chapterCacheRef, chapterCurrentAyahRef, chapterKeyRef, chapterModeRef, chapterSwitchingRef, chapterTimingIndexRef, disableChapterMode, getChapterCacheKey, isAudioPausedRef, isAutoPlaying, memorizeActive, nowPlaying, pausedByMediaSessionRef, playbackRateRef, reciterId]);

  useEffect(() => {
    if (!selectedSurah || memorizeActive) return;
    if (!QURAN_API_RECITER_BY_LOCAL_ID[reciterId]) return;

    let cancelled = false;

    void fetchChapterAudioData(reciterId, selectedSurah.number).then((chapterData) => {
      if (cancelled || !chapterData || typeof window === "undefined") return;

      const preloader = chapterPreloadRef.current ?? new Audio();
      preloader.preload = "metadata";
      if (preloader.src !== chapterData.audioUrl) {
        preloader.src = chapterData.audioUrl;
        chapterPreloadRef.current = preloader;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chapterPreloadRef, fetchChapterAudioData, memorizeActive, reciterId, selectedSurah]);

  // Update src imperatively (no remount) and play.
  // Guard: if audio is already playing the correct src (set imperatively in the
  // background ended handler), do NOT reload or re-call play() — that would
  // interrupt background playback when React finally re-renders.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioSrc) {
      pausedByMediaSessionRef.current = false;
      disableChapterMode();
      audio.pause();
      audio.src = "";
      return;
    }

    if (chapterModeRef.current || chapterSwitchingRef.current) {
      return;
    }

    // Only reload if src actually changed
    if (audio.src !== audioSrc) {
      pausedByMediaSessionRef.current = false;
      audio.src = audioSrc;
      audio.load();
    }

    audio.playbackRate = playbackRate;

    if (isAutoPlaying && !isAudioPaused && audio.paused) {
      if (pausedByMediaSessionRef.current) return;
      // Only call play() if not already playing — avoids restarting
      // audio that the background handler already started.
      audio.play().catch(() => {});
    }
  }, [audioSrc, disableChapterMode, isAutoPlaying, isAudioPaused, playbackRate, audioRef, chapterModeRef, chapterSwitchingRef, pausedByMediaSessionRef]);

  // Pause / resume for single-ayah playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || isAutoPlaying || chapterModeRef.current) return;
    if (isAudioPaused) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {});
    }
  }, [isAudioPaused, isAutoPlaying, audioSrc, playbackRate, audioRef, chapterModeRef]);

  // Sync playback rate without src change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [audioRef, playbackRate]);

  // Preload next verse while current is playing
  useEffect(() => {
    if (!nextAudioSrc) return;
    const preload = new Audio();
    preload.preload = "auto";
    preload.src = nextAudioSrc;
    preloadRef.current = preload;
    return () => {
      preload.src = "";
      preloadRef.current = null;
    };
  }, [nextAudioSrc, preloadRef]);

  // Media Session API — tells the OS this is an active audio session
  // so the browser keeps JS alive between verses in background
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!audioSrc || !nowPlaying) {
      navigator.mediaSession.playbackState = "none";
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlayingLabel,
      artist: reciterLabel,
      album: "The Holy Quran — OpenFurqan",
      artwork: [
        { src: "/icons/openfurqan-app-v6-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/openfurqan-app-v6-512.png", sizes: "512x512", type: "image/png" }
      ]
    });

    navigator.mediaSession.playbackState = isAudioPaused ? "paused" : "playing";

    navigator.mediaSession.setActionHandler("play", () => {
      pausedByMediaSessionRef.current = false;
      isAudioPausedRef.current = false;
      audioRef.current?.play().catch(() => {});
      navigator.mediaSession.playbackState = "playing";
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      pausedByMediaSessionRef.current = true;
      isAudioPausedRef.current = true;
      audioRef.current?.pause();
      navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      onAudioEnded();
    });

    // previoustrack not supported in current design
    navigator.mediaSession.setActionHandler("previoustrack", null);

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      } catch {
        // ignore
      }
    };
  }, [audioSrc, nowPlaying, nowPlayingLabel, reciterLabel, isAudioPaused, onAudioEnded, pausedByMediaSessionRef, isAudioPausedRef, audioRef]);

  // Visibility handler: when returning to the foreground, resume audio if the
  // OS paused it (e.g. after a phone call or OS-level interruption).
  useEffect(() => {
    const onVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState === "hidden") {
        // Only activate chapter mode if NOT already in it.
        // If chapter mode is already active, the surah is a single continuous
        // audio file — it keeps playing in the background with no intervention.
        // Calling activateChapterMode again while in chapter mode wrongly uses
        // audio.currentTime (full-file position) as ayah-relative elapsed time,
        // which causes a bad seek that breaks background playback.
        if (isAutoPlayingRef.current && !isAudioPausedRef.current && !chapterModeRef.current) {
          void activateChapterMode({ preserveAyahProgress: false });
        }
        return;
      }

      // Coming back to visible — only act if audio unexpectedly stopped.
      if (!isAutoPlayingRef.current || isAudioPausedRef.current) return;
      if (pausedByMediaSessionRef.current) return;
      if (!audio.paused) return;

      if (chapterModeRef.current) {
        // Chapter mode is active but audio paused (OS may have interrupted it).
        // Just resume — don't restart from the beginning.
        audio.playbackRate = playbackRateRef.current;
        audio.play().catch(() => {});
        return;
      }

      // Ayah mode: restart from the last src React state recorded.
      const stateSrc = audioSrcRef.current;
      if (stateSrc && audio.src !== stateSrc) {
        audio.src = stateSrc;
        audio.load();
      }
      audio.playbackRate = playbackRateRef.current;
      audio.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activateChapterMode, audioRef, audioSrcRef, chapterModeRef, isAudioPausedRef, isAutoPlayingRef, pausedByMediaSessionRef, playbackRateRef]);

}
