export type SortedNote = {
  key: string;
  surah: number;
  ayah: number;
  value: string;
};

export type SimpleQuickNote = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export const formatRelativeTime = (timestamp: number) => {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export const formatDuration = (durationMs: number) => {
  const totalSeconds = durationMs > 0 ? Math.max(1, Math.round(durationMs / 1000)) : 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

export const getAudioFileExtension = (mimeType: string) => {
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "m4a";
  return "audio";
};

export const createAudioFileName = (title: string, mimeType: string) => {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "recitation-note"}.${getAudioFileExtension(mimeType)}`;
};

export const isPlaceholderNoteTitle = (value: string) =>
  (value || "").trim().toLowerCase() === "untitled note";

export const deriveNoteTitle = (title: string, body: string) => {
  const explicitTitle = (title || "").trim();
  if (explicitTitle && !isPlaceholderNoteTitle(explicitTitle)) {
    return explicitTitle;
  }
  const bodyLine = (body || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find(Boolean);
  if (!bodyLine) {
    return "Note";
  }
  return bodyLine.length > 42 ? `${bodyLine.slice(0, 42).trim()}...` : bodyLine;
};

