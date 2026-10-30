import type { ChapterVerseTiming, Surah } from "../../lib/types";

export type SurahSummary = Pick<Surah, "number" | "numberOfAyahs">;

export type NowPlaying = {
  surah: number;
  ayah: number;
};

export type AudioPlayerProps = {
  reciterId: string;
  reciterLabel: string;
  reciterBaseUrl?: string;
  nowPlayingLabel: string;
  audioSrc: string | null;
  nextAudioSrc?: string | null;
  isAutoPlaying: boolean;
  isAudioPaused?: boolean;
  playbackRate?: number;
  onPlaySurah: (startAyah: number) => void;
  onStopAutoPlay: () => void;
  onAudioEnded: () => void;
  selectedSurah: SurahSummary | null;
  nowPlaying: NowPlaying | null;
  nowPlayingPage?: number | null;
  surahPageStart?: number | null;
  surahPageEnd?: number | null;
  showSurahControls?: boolean;
  showPlayerBar?: boolean;
  memorizeActive?: boolean;
  memorizeStartAyah?: number;
  memorizeEndAyah?: number;
  memorizeLoops?: number;
  memorizeRemaining?: number;
  onWordTimingChange?: (position: number | null) => void;
};

export type ChapterTimestamp = {
  verse_key?: string;
  timestamp_from?: number;
  timestamp_to?: number;
  segments?: unknown[];
};

export type ChapterRecitationResponse = {
  audio_file?: {
    audio_url?: string;
    timestamps?: ChapterTimestamp[];
  };
};

export type ChapterAudioData = {
  audioUrl: string;
  timings: ChapterVerseTiming[];
  byAyah: Map<number, ChapterVerseTiming>;
};

export type ActivateChapterModeOptions = {
  preserveAyahProgress: boolean;
  allowWhileVisible?: boolean;
  targetAyah?: number;
};

