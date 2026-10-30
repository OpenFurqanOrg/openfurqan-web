"use client";

import type { AudioPlayerProps } from "./audioPlayerTypes";
import { useAudioPlayerEffects } from "./useAudioPlayerEffects";
import { useChapterPlayback } from "./useChapterPlayback";

export default function AudioPlayer(props: AudioPlayerProps) {
  const {
    reciterLabel,
    nowPlayingLabel,
    audioSrc,
    isAutoPlaying,
    onPlaySurah,
    onStopAutoPlay,
    selectedSurah,
    nowPlaying,
    showSurahControls = true,
    showPlayerBar = true,
  } = props;
  const runtime = useChapterPlayback(props);
  useAudioPlayerEffects(runtime);
  const {
    audioRef,
  } = runtime;

  if (!showPlayerBar) {
    // Single persistent hidden audio element — no key prop, never remounted
    return <audio ref={audioRef} hidden />;
  }

  return (
    <div className="audio-bar">
      <div className="audio-info">
        <p className="label">Recitation</p>
        <p className="meta">
          {reciterLabel} - {nowPlayingLabel}
        </p>
      </div>
      <div className="audio-controls">
        {showSurahControls && selectedSurah && (
          <div className="surah-play-controls">
            {isAutoPlaying ? (
              <button className="action-btn stop-btn" onClick={onStopAutoPlay}>
                ⏹ Stop
              </button>
            ) : (
              <button
                className="action-btn play-surah-btn"
                onClick={() => onPlaySurah(nowPlaying?.ayah || 1)}
              >
                ▶ Play Surah
              </button>
            )}
          </div>
        )}
        {/* Single persistent audio element — no key prop */}
        <audio ref={audioRef} controls />
        {!audioSrc && <div className="audio-placeholder">Ready</div>}
      </div>
    </div>
  );
}
