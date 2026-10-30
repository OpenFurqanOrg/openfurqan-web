"use client";

import { createAudioFileName, deriveNoteTitle, formatDuration, formatFileSize, formatRelativeTime, isPlaceholderNoteTitle, type SimpleQuickNote, type SortedNote } from "./studyNoteFormatting";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAudioNotes, useLocalStorage } from "../../hooks";
import { STORAGE_KEYS } from "../../lib/constants";
import StudyAudioNotePlayer from "./StudyAudioNotePlayer";

type StudyQuickNotesSectionProps = {
  sortedNotes: SortedNote[];
  surahByNumber: Map<number, { englishName: string }>;
  onJumpToAyah: (surah: number, ayah: number) => void;
  onClosePanel: () => void;
  onOpenNote: (surah: number, ayah: number) => void;
};

export default function StudyQuickNotesSection({
  sortedNotes,
  surahByNumber,
  onJumpToAyah,
  onClosePanel,
  onOpenNote
}: StudyQuickNotesSectionProps) {
  const [storedSimpleNotes, setStoredSimpleNotes] = useLocalStorage<SimpleQuickNote[]>(
    STORAGE_KEYS.quickNotes,
    []
  );
  const [activeSimpleNoteId, setActiveSimpleNoteId] = useState<string | null>(null);
  const [isCreatingSimpleNote, setIsCreatingSimpleNote] = useState(false);
  const [simpleNoteTitleDraft, setSimpleNoteTitleDraft] = useState("");
  const [simpleNoteBodyDraft, setSimpleNoteBodyDraft] = useState("");
  const {
    audioNotes,
    pendingRecording,
    isLoaded: isAudioNotesLoaded,
    isPreparingRecording,
    isSaving: isSavingAudioNote,
    isDeleting: isDeletingAudioNote,
    isRecording,
    isRecordingSupported,
    isPersistenceSupported,
    recordingDurationMs,
    totalAudioBytes,
    showRecitationStorageNotice,
    error: audioNoteError,
    startRecording,
    stopRecording,
    discardPendingRecording,
    savePendingRecording,
    deleteAudioNote,
    dismissRecitationStorageNotice
  } = useAudioNotes();
  const [isCreatingAudioNote, setIsCreatingAudioNote] = useState(false);
  const [audioNoteTitleDraft, setAudioNoteTitleDraft] = useState("");

  const simpleNotes = useMemo(() => {
    const source = Array.isArray(storedSimpleNotes) ? storedSimpleNotes : [];
    return source.reduce<SimpleQuickNote[]>((result, note) => {
      const nextBody = (note.body || "").trim();
      const nextTitleRaw = (note.title || "").trim();
      const nextTitle = isPlaceholderNoteTitle(nextTitleRaw) ? "" : nextTitleRaw;
      if (!nextTitle && !nextBody) {
        return result;
      }
      result.push({
        ...note,
        title: deriveNoteTitle(nextTitle, nextBody),
        body: nextBody
      });
      return result;
    }, []);
  }, [storedSimpleNotes]);
  const orderedSimpleNotes = useMemo(
    () => [...simpleNotes].sort((a, b) => b.updatedAt - a.updatedAt),
    [simpleNotes]
  );

  useEffect(() => {
    if (!Array.isArray(storedSimpleNotes)) return;
    const shouldSync =
      storedSimpleNotes.length !== simpleNotes.length ||
      storedSimpleNotes.some((note, index) => {
        const normalized = simpleNotes[index];
        if (!normalized) return true;
        return (
          note.id !== normalized.id ||
          note.title !== normalized.title ||
          (note.body || "").trim() !== normalized.body ||
          note.createdAt !== normalized.createdAt ||
          note.updatedAt !== normalized.updatedAt
        );
      });
    if (shouldSync) {
      setStoredSimpleNotes(simpleNotes);
    }
  }, [storedSimpleNotes, simpleNotes, setStoredSimpleNotes]);

  useEffect(() => {
    if (orderedSimpleNotes.length === 0) {
      if (activeSimpleNoteId !== null) {
        setActiveSimpleNoteId(null);
      }
      return;
    }
    if (activeSimpleNoteId && !orderedSimpleNotes.some((note) => note.id === activeSimpleNoteId)) {
      setActiveSimpleNoteId(orderedSimpleNotes[0]?.id || null);
    }
  }, [activeSimpleNoteId, orderedSimpleNotes]);

  const activeSimpleNote = useMemo(
    () => orderedSimpleNotes.find((note) => note.id === activeSimpleNoteId) || null,
    [orderedSimpleNotes, activeSimpleNoteId]
  );

  useEffect(() => {
    if (isCreatingSimpleNote) {
      return;
    }
    if (!activeSimpleNote) {
      setSimpleNoteTitleDraft("");
      setSimpleNoteBodyDraft("");
      return;
    }
    setSimpleNoteTitleDraft(activeSimpleNote.title || "");
    setSimpleNoteBodyDraft(activeSimpleNote.body || "");
  }, [activeSimpleNote, isCreatingSimpleNote]);

  const createSimpleNote = useCallback(() => {
    setIsCreatingSimpleNote(true);
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, []);

  const updateSimpleNote = useCallback(
    (noteId: string, patch: Partial<Pick<SimpleQuickNote, "title" | "body">>) => {
      setStoredSimpleNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((note) =>
          note.id === noteId
            ? {
                ...note,
                ...patch,
                updatedAt: Date.now()
              }
            : note
        )
      );
    },
    [setStoredSimpleNotes]
  );

  const saveActiveSimpleNote = useCallback(() => {
    const nextTitleRaw = (simpleNoteTitleDraft || "").trim();
    const nextBody = (simpleNoteBodyDraft || "").trim();
    if (!nextTitleRaw && !nextBody) return;
    const nextTitle = deriveNoteTitle(nextTitleRaw, nextBody);

    if (isCreatingSimpleNote) {
      const now = Date.now();
      const nextNote: SimpleQuickNote = {
        id: `qnote-${now}-${Math.random().toString(36).slice(2, 8)}`,
        title: nextTitle,
        body: nextBody,
        createdAt: now,
        updatedAt: now
      };
      setStoredSimpleNotes((prev) => [nextNote, ...(Array.isArray(prev) ? prev : [])]);
    } else if (activeSimpleNote) {
      updateSimpleNote(activeSimpleNote.id, {
        title: nextTitle,
        body: nextBody
      });
    }

    setIsCreatingSimpleNote(false);
    setActiveSimpleNoteId(null);
  }, [
    activeSimpleNote,
    isCreatingSimpleNote,
    simpleNoteTitleDraft,
    simpleNoteBodyDraft,
    setStoredSimpleNotes,
    updateSimpleNote
  ]);

  const deleteActiveSimpleNote = useCallback(() => {
    if (isCreatingSimpleNote || !activeSimpleNote) return;
    setStoredSimpleNotes((prev) =>
      (Array.isArray(prev) ? prev : []).filter((note) => note.id !== activeSimpleNote.id)
    );
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, [activeSimpleNote, isCreatingSimpleNote, setStoredSimpleNotes]);

  const cancelEditing = useCallback(() => {
    setIsCreatingSimpleNote(false);
    setActiveSimpleNoteId(null);
    setSimpleNoteTitleDraft("");
    setSimpleNoteBodyDraft("");
  }, []);

  const quickNoteHasDraftChanges = isCreatingSimpleNote
    ? Boolean((simpleNoteTitleDraft || "").trim() || (simpleNoteBodyDraft || "").trim())
    : Boolean(
        activeSimpleNote &&
          (activeSimpleNote.title !== simpleNoteTitleDraft ||
            activeSimpleNote.body !== simpleNoteBodyDraft)
      );

  const isEditing = activeSimpleNote || isCreatingSimpleNote;
  const isSecureRecordingContext = typeof window !== "undefined" ? window.isSecureContext : true;
  const canCreateAudioNotes = isAudioNotesLoaded && isRecordingSupported && isPersistenceSupported && isSecureRecordingContext;
  const audioComposerStatus = isRecording
    ? `Recording ${formatDuration(recordingDurationMs)}`
    : pendingRecording
      ? `Ready to save • ${formatDuration(pendingRecording.durationMs)} • ${formatFileSize(pendingRecording.size)}`
      : isPreparingRecording
        ? "Waiting for microphone access"
        : "Record your recitation and save it on this device";
  const audioCapabilityMessage = !isAudioNotesLoaded
    ? ""
    : !isSecureRecordingContext
      ? "Audio recording requires HTTPS or localhost on this device."
    : !isPersistenceSupported
      ? "This browser cannot save recorded audio locally."
      : !isRecordingSupported
        ? "This browser does not support in-app audio recording."
        : "";

  const createAudioNote = useCallback(() => {
    setIsCreatingAudioNote(true);
    setAudioNoteTitleDraft("");
  }, []);

  const cancelAudioNote = useCallback(() => {
    if (isRecording || isPreparingRecording) return;
    discardPendingRecording();
    setAudioNoteTitleDraft("");
    setIsCreatingAudioNote(false);
  }, [discardPendingRecording, isPreparingRecording, isRecording]);

  const saveAudioNote = useCallback(async () => {
    const didSave = await savePendingRecording(audioNoteTitleDraft);
    if (!didSave) return;
    setAudioNoteTitleDraft("");
    setIsCreatingAudioNote(false);
  }, [audioNoteTitleDraft, savePendingRecording]);

  const handleStartAudioRecording = useCallback(() => {
    void startRecording();
  }, [startRecording]);

  const handleDeleteAudioNote = useCallback(
    (noteId: string) => {
      void deleteAudioNote(noteId);
    },
    [deleteAudioNote]
  );

  const handleDownloadAudio = useCallback((audioUrl: string, title: string, mimeType: string) => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = createAudioFileName(title, mimeType);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="quick-panel-section notes-panel-redesign">
      {/* ── Quick Notes Section ── */}
      <div className="notes-section">
        <div className="notes-section-header">
          <span className="notes-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Quick Notes
          </span>
          {!isEditing && (
            <button className="notes-section-action notes-new-btn" onClick={createSimpleNote} type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </button>
          )}
        </div>

        {/* Editor (create or edit) */}
        {isEditing && (
          <div className="notes-editor">
            <input
              className="notes-editor-title"
              value={simpleNoteTitleDraft}
              onChange={(event) => setSimpleNoteTitleDraft(event.target.value)}
              placeholder="Title (optional)"
              autoFocus
            />
            <textarea
              className="notes-editor-body"
              value={simpleNoteBodyDraft}
              onChange={(event) => setSimpleNoteBodyDraft(event.target.value)}
              placeholder="Write your note..."
              rows={6}
            />
            <div className="notes-editor-footer">
              <span className="notes-editor-status">
                {isCreatingSimpleNote
                  ? "New note"
                  : quickNoteHasDraftChanges
                    ? "Unsaved changes"
                    : activeSimpleNote
                      ? `Updated ${formatRelativeTime(activeSimpleNote.updatedAt)}`
                      : ""}
              </span>
              <div className="notes-editor-actions">
                {!isCreatingSimpleNote && activeSimpleNote && (
                  <button
                    className="notes-btn notes-btn--danger"
                    onClick={deleteActiveSimpleNote}
                    type="button"
                  >
                    Delete
                  </button>
                )}
                <button
                  className="notes-btn notes-btn--ghost"
                  onClick={cancelEditing}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="notes-btn notes-btn--primary"
                  onClick={saveActiveSimpleNote}
                  type="button"
                  disabled={!quickNoteHasDraftChanges}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Note list */}
        {!isEditing && orderedSimpleNotes.length > 0 && (
          <div className="notes-list">
            {orderedSimpleNotes.map((note) => {
              const title = deriveNoteTitle(note.title, note.body);
              return (
                <button
                  key={note.id}
                  className="notes-list-item"
                  onClick={() => {
                    setIsCreatingSimpleNote(false);
                    setActiveSimpleNoteId(note.id);
                  }}
                  type="button"
                >
                  <div className="notes-list-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="notes-list-item-content">
                    <span className="notes-list-item-title">{title}</span>
                    <span className="notes-list-item-time">{formatRelativeTime(note.updatedAt)}</span>
                  </div>
                  <svg className="notes-list-item-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isEditing && orderedSimpleNotes.length === 0 && (
          <div className="notes-empty">
            <div className="notes-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <p className="notes-empty-title">No quick notes yet</p>
            <span className="notes-empty-desc">Jot down thoughts, reflections, or reminders</span>
            <button className="notes-btn notes-btn--primary notes-create-btn" onClick={createSimpleNote} type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create first note
            </button>
          </div>
        )}
      </div>

      <div className="notes-section">
        <div className="notes-section-header">
          <span className="notes-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3z" />
              <path d="M19 11a7 7 0 01-14 0" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
            Recitation Notes
          </span>
          <div className="notes-section-header-actions">
            {audioNotes.length > 0 && <span className="notes-count-badge">{audioNotes.length}</span>}
            {!isCreatingAudioNote && (
              <button
                className="notes-section-action notes-new-btn"
                onClick={createAudioNote}
                type="button"
                disabled={!canCreateAudioNotes}
                aria-label="Create recitation note"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New
              </button>
            )}
          </div>
        </div>

        {showRecitationStorageNotice && (
          <div className="notes-audio-notice" role="status">
            <div className="notes-audio-notice-copy">
              <span className="notes-audio-notice-title">Recitation storage notice</span>
              <span className="notes-audio-notice-text">
                You&#39;ve used {formatFileSize(totalAudioBytes)} of local storage for recitation recordings on this device.
              </span>
            </div>

            <button
              className="notes-audio-notice-dismiss"
              onClick={dismissRecitationStorageNotice}
              type="button"
              aria-label="Dismiss recitation storage notice"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        {isCreatingAudioNote && (
          <div className="notes-editor notes-editor--audio">
            <input
              className="notes-editor-title"
              value={audioNoteTitleDraft}
              onChange={(event) => setAudioNoteTitleDraft(event.target.value)}
              placeholder="Title (optional)"
            />

            <div className="notes-audio-recorder">
              <div className="notes-audio-recorder-main">
                <div className={`notes-audio-recorder-badge${isRecording ? " is-recording" : ""}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3z" />
                    <path d="M19 11a7 7 0 01-14 0" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                </div>

                <div className="notes-audio-recorder-copy">
                  <span className="notes-audio-recorder-label">
                    {isRecording ? "Recording in progress" : pendingRecording ? "Preview ready" : "Recitation note"}
                  </span>
                  <span className="notes-audio-recorder-time">
                    {formatDuration(isRecording ? recordingDurationMs : pendingRecording?.durationMs || 0)}
                  </span>
                </div>
              </div>

              <button
                className={`notes-btn ${isRecording ? "notes-btn--danger" : "notes-btn--primary"}`}
                onClick={isRecording ? stopRecording : handleStartAudioRecording}
                type="button"
                disabled={isPreparingRecording || !canCreateAudioNotes}
              >
                {isPreparingRecording ? "Preparing..." : isRecording ? "Stop" : pendingRecording ? "Record again" : "Start recording"}
              </button>
            </div>

            {pendingRecording && (
              <StudyAudioNotePlayer
                audioSrc={pendingRecording.audioUrl}
                title={audioNoteTitleDraft.trim() || "Draft preview"}
                meta={`Unsaved preview • ${formatDuration(pendingRecording.durationMs)} • ${formatFileSize(pendingRecording.size)}`}
                fallbackDurationMs={pendingRecording.durationMs}
                className="notes-audio-card--draft"
                actions={[
                  {
                    label: "Download",
                    onClick: () => handleDownloadAudio(
                      pendingRecording.audioUrl,
                      audioNoteTitleDraft.trim() || "Draft preview",
                      pendingRecording.mimeType
                    ),
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12" />
                        <path d="m7 10 5 5 5-5" />
                        <path d="M5 21h14" />
                      </svg>
                    )
                  }
                ]}
              />
            )}

            {audioCapabilityMessage ? <span className="notes-audio-hint">{audioCapabilityMessage}</span> : null}
            {audioNoteError ? <span className="notes-audio-error" role="alert">{audioNoteError}</span> : null}

            <div className="notes-editor-footer">
              <span className="notes-editor-status">{audioComposerStatus}</span>
              <div className="notes-editor-actions">
                <button
                  className="notes-btn notes-btn--ghost"
                  onClick={cancelAudioNote}
                  type="button"
                  disabled={isRecording || isPreparingRecording || isSavingAudioNote}
                >
                  Discard
                </button>
                <button
                  className="notes-btn notes-btn--primary"
                  onClick={() => {
                    void saveAudioNote();
                  }}
                  type="button"
                  disabled={!pendingRecording || isSavingAudioNote}
                >
                  {isSavingAudioNote ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isCreatingAudioNote && audioNoteError ? <span className="notes-audio-error" role="alert">{audioNoteError}</span> : null}

        {isAudioNotesLoaded && audioNotes.length > 0 && (
          <div className="notes-list notes-list--audio">
            {audioNotes.map((note) => (
              <StudyAudioNotePlayer
                key={note.id}
                audioSrc={note.audioUrl}
                title={note.title}
                meta={`${formatDuration(note.durationMs)} • ${formatFileSize(note.size)} • ${formatRelativeTime(note.updatedAt)}`}
                fallbackDurationMs={note.durationMs}
                actions={[
                  {
                    label: "Download",
                    onClick: () => handleDownloadAudio(note.audioUrl, note.title, note.mimeType),
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v12" />
                        <path d="m7 10 5 5 5-5" />
                        <path d="M5 21h14" />
                      </svg>
                    )
                  },
                  {
                    label: "Delete",
                    onClick: () => handleDeleteAudioNote(note.id),
                    disabled: isDeletingAudioNote,
                    tone: "danger",
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    )
                  }
                ]}
              />
            ))}
          </div>
        )}

        {!isCreatingAudioNote && isAudioNotesLoaded && audioNotes.length === 0 && (
          <div className="notes-empty notes-empty--compact">
            <div className="notes-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3z" />
                <path d="M19 11a7 7 0 01-14 0" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
            </div>
            <p className="notes-empty-title">No recitation notes yet</p>
            <span className="notes-empty-desc">Record your recitation</span>
            {audioCapabilityMessage ? <span className="notes-audio-hint">{audioCapabilityMessage}</span> : null}
            <button
              className="notes-btn notes-btn--primary notes-create-btn"
              onClick={createAudioNote}
              type="button"
              disabled={!canCreateAudioNotes}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create first recording
            </button>
          </div>
        )}
      </div>

      {/* ── Ayah Notes Section ── */}
      <div className="notes-section">
        <div className="notes-section-header">
          <span className="notes-section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Ayah Notes
          </span>
          {sortedNotes?.length > 0 && (
            <span className="notes-count-badge">{sortedNotes.length}</span>
          )}
        </div>

        {sortedNotes?.length > 0 ? (
          <div className="notes-list">
            {sortedNotes.map((note) => {
              const name = surahByNumber?.get(note.surah)?.englishName || `Surah ${note.surah}`;
              const preview = note.value.length > 60 ? `${note.value.slice(0, 60)}...` : note.value;
              return (
                <div key={note.key} className="notes-ayah-item">
                  <button
                    className="notes-ayah-item-main"
                    onClick={() => {
                      onJumpToAyah(note.surah, note.ayah);
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                  >
                    <div className="notes-ayah-ref">
                      <span className="notes-ayah-ref-num">{note.surah}:{note.ayah}</span>
                    </div>
                    <div className="notes-ayah-item-content">
                      <span className="notes-ayah-name">{name} - Ayah {note.ayah}</span>
                      <span className="notes-ayah-preview">{preview}</span>
                    </div>
                  </button>
                  <button
                    className="notes-btn notes-btn--small"
                    onClick={() => {
                      onOpenNote(note.surah, note.ayah);
                      onClosePanel();
                    }}
                    type="button"
                    aria-label="Edit note"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="notes-empty notes-empty--compact">
            <div className="notes-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="notes-empty-title">No ayah notes yet</p>
            <span className="notes-empty-desc">Tap the note icon on any ayah to add your thoughts</span>
          </div>
        )}
      </div>
    </div>
  );
}
