import type { MemorizationCard, MemorizationCardMode, MemorizationDeckResponse, MemorizationScopeMode } from "../../lib/types";
import { getAudioUrl } from "../../lib/utils";

export type MemorizationDeckPrefs = {
  scopeMode: MemorizationScopeMode;
  surahNumber: number;
  juzNumber: number;
  pageNumber: number;
  cardMode: MemorizationCardMode;
};

export const DEFAULT_PREFS: MemorizationDeckPrefs = {
  scopeMode: "surah",
  surahNumber: 1,
  juzNumber: 1,
  pageNumber: 1,
  cardMode: "word-by-word-meaning"
};

export const CARD_MODES: Array<{ id: MemorizationCardMode; label: string; desc: string; icon: string }> = [
  {
    id: "word-by-word-meaning",
    label: "Word → Meaning",
    desc: "See an Arabic word, guess its meaning",
    icon: "Aa"
  },
  { id: "arabic-to-meaning", label: "Arabic → Meaning", desc: "See the Arabic ayah, guess its translation", icon: "عر" },
  { id: "meaning-to-arabic", label: "Meaning → Arabic", desc: "See the translation, recall the Arabic", icon: "En" },
  { id: "first-words", label: "First Words", desc: "See the opening words, complete the ayah", icon: "..." }
];

export const WORD_AUDIO_PREFIX = "https://audio.qurancdn.com/wbw/";

export const shouldPreserveCardAudio = (card: MemorizationCard) =>
  card.cardMode === "word-by-word-meaning" && card.audioUrl.startsWith(WORD_AUDIO_PREFIX);

export function applyReciterToMemorizationDeck(
  deck: MemorizationDeckResponse | null,
  reciterBaseUrl: string
): MemorizationDeckResponse | null {
  if (!deck) return null;

  return {
    ...deck,
    cards: deck.cards.map((card) => {
      if (shouldPreserveCardAudio(card)) {
        return card;
      }

      const audioUrl = getAudioUrl(reciterBaseUrl, card.surahNumber, card.ayahNumber);
      return card.audioUrl === audioUrl ? card : { ...card, audioUrl };
    })
  };
}

