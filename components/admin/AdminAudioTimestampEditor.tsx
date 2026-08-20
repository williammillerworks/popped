"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type StageNumber } from "../../config/game";
import { isAutoplayBlocked, seekAudio } from "../../lib/audioPlayback";
import { validateAudioPreviewRange } from "../../lib/audioPreviewValidation";
import {
  AdminAlert,
  ADMIN_BUTTON_SECONDARY,
  AdminIcon,
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
} from "./admin-ui";

type PlaybackMode = "full" | "stage" | "reveal";
type PlaybackStatus = "idle" | "loading" | "playing" | "finished" | "error";

type PlaybackState = {
  durationSeconds?: number;
  label: string;
  mode: PlaybackMode;
  status: PlaybackStatus;
};

type AudioMetadataState = {
  durationSeconds: number | null;
  previewUrl: string;
  status: "ready" | "error";
};

export type AudioRangeValidationState = {
  message: string;
  status: "idle" | "checking" | "valid" | "invalid" | "unavailable";
};

type AdminAudioTimestampEditorProps = {
  error?: string;
  onRangeValidationChange: (state: AudioRangeValidationState) => void;
  onStartSecondsChange: (value: string) => void;
  previewStartSeconds: string;
  previewUrl: string;
  stageDurations: readonly number[];
};

const IDLE_PLAYBACK: PlaybackState = {
  label: "Audio preview ready.",
  mode: "stage",
  status: "idle",
};

export function AdminAudioTimestampEditor({
  error,
  onRangeValidationChange,
  onStartSecondsChange,
  previewStartSeconds,
  previewUrl,
  stageDurations,
}: AdminAudioTimestampEditorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activePlayIdRef = useRef(0);
  const stopIntervalRef = useRef<number | null>(null);
  const [audioMessage, setAudioMessage] = useState(
    "Add a preview URL, then audition the timestamp.",
  );
  const [audioMetadata, setAudioMetadata] =
    useState<AudioMetadataState | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>(IDLE_PLAYBACK);

  const startSeconds = parsePreviewStartSeconds(previewStartSeconds);
  const hasPreviewUrl = previewUrl.trim().length > 0;
  const displayedAudioMessage = hasPreviewUrl
    ? audioMessage
    : "Add a preview URL, then audition the timestamp.";
  const displayedPlayback = hasPreviewUrl ? playback : IDLE_PLAYBACK;
  const metadataMatchesPreview = audioMetadata?.previewUrl === previewUrl;
  const metadataStatus = !hasPreviewUrl
    ? "idle"
    : metadataMatchesPreview
      ? audioMetadata.status
      : "loading";
  const audioDurationSeconds = metadataMatchesPreview
    ? audioMetadata.durationSeconds
    : null;
  const rangeValidation = useMemo(
    () =>
      audioDurationSeconds === null
        ? null
        : validateAudioPreviewRange({
            audioDurationSeconds,
            previewStartSeconds: startSeconds,
            stageDurations,
          }),
    [audioDurationSeconds, stageDurations, startSeconds],
  );

  useEffect(() => {
    activePlayIdRef.current += 1;

    if (stopIntervalRef.current !== null) {
      window.clearInterval(stopIntervalRef.current);
      stopIntervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (!hasPreviewUrl) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    function handleLoadStart() {
      setAudioMessage("Audio loading.");
      setPlayback(IDLE_PLAYBACK);
    }

    function handleCanPlay() {
      setAudioMessage("Audio ready.");
    }

    function handleLoadedMetadata() {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioMetadata({
          durationSeconds: audio.duration,
          previewUrl,
          status: "ready",
        });
      }
    }

    function handleError() {
      clearStopInterval();
      setAudioMetadata({
        durationSeconds: null,
        previewUrl,
        status: "error",
      });
      setAudioMessage("Audio could not load. Check the preview URL.");
      setPlayback({
        label: "Audio load failed.",
        mode: "stage",
        status: "error",
      });
    }

    function handleEnded() {
      clearStopInterval();
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        label: `${currentPlayback.label} Finished.`,
        status: "finished",
      }));
    }

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.load();

    return () => {
      clearStopInterval();
      audio.pause();
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [hasPreviewUrl, previewUrl]);

  useEffect(() => {
    if (!hasPreviewUrl) {
      onRangeValidationChange({ message: "", status: "idle" });
      return;
    }

    if (metadataStatus === "loading") {
      onRangeValidationChange({
        message: "Checking the available audio duration...",
        status: "checking",
      });
      return;
    }

    if (metadataStatus === "error" || !rangeValidation) {
      onRangeValidationChange({
        message:
          "Audio duration could not be verified. Check the preview URL before publishing.",
        status: "unavailable",
      });
      return;
    }

    onRangeValidationChange({
      message: rangeValidation.message,
      status: rangeValidation.valid ? "valid" : "invalid",
    });
  }, [
    hasPreviewUrl,
    metadataStatus,
    onRangeValidationChange,
    rangeValidation,
  ]);

  function adjustStartSeconds(delta: number) {
    onStartSecondsChange(formatTimestampInput(Math.max(0, startSeconds + delta)));
  }

  function clearStopInterval() {
    if (stopIntervalRef.current !== null) {
      window.clearInterval(stopIntervalRef.current);
      stopIntervalRef.current = null;
    }
  }

  async function playPreview({
    durationSeconds,
    label,
    mode,
    startAtSeconds,
  }: {
    durationSeconds?: number;
    label: string;
    mode: PlaybackMode;
    startAtSeconds: number;
  }) {
    const audio = audioRef.current;

    if (!audio || !hasPreviewUrl) {
      setAudioMessage("Add a preview URL before playing audio.");
      setPlayback({
        durationSeconds,
        label,
        mode,
        status: "error",
      });
      return;
    }

    const playId = activePlayIdRef.current + 1;
    activePlayIdRef.current = playId;
    clearStopInterval();
    audio.pause();
    setAudioMessage("Loading audio preview.");
    setPlayback({
      durationSeconds,
      label,
      mode,
      status: "loading",
    });

    try {
      const actualStartSeconds = await seekAudio(audio, startAtSeconds);
      await audio.play();

      if (activePlayIdRef.current !== playId) {
        return;
      }

      setAudioMessage(`${label} playing.`);
      setPlayback({
        durationSeconds,
        label,
        mode,
        status: "playing",
      });

      if (durationSeconds !== undefined) {
        const stopAtSeconds = actualStartSeconds + durationSeconds;

        stopIntervalRef.current = window.setInterval(() => {
          if (activePlayIdRef.current !== playId) {
            clearStopInterval();
            return;
          }

          if (audio.currentTime >= stopAtSeconds || audio.ended) {
            audio.pause();
            clearStopInterval();
            setPlayback({
              durationSeconds,
              label,
              mode,
              status: "finished",
            });
            setAudioMessage(`${label} finished.`);
          }
        }, 10);
      }
    } catch (playError) {
      if (activePlayIdRef.current !== playId) {
        return;
      }

      const message = isAutoplayBlocked(playError)
        ? "Browser blocked audio. Tap a preview button again."
        : "Audio could not play. Check the preview URL.";

      setAudioMessage(message);
      setPlayback({
        durationSeconds,
        label,
        mode,
        status: "error",
      });
    }
  }

  const statusTone = {
    error: "bg-admin-destructive-soft text-admin-destructive",
    finished: "bg-admin-success-soft text-admin-success",
    idle: "bg-admin-surface-strong text-admin-muted",
    loading: "bg-admin-accent-soft text-admin-accent",
    playing: "bg-admin-success-soft text-admin-success",
  }[displayedPlayback.status];

  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface-subtle/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-admin-accent">
            Timestamp editor
          </p>
          <h3 className="mt-1.5 text-base font-semibold tracking-[-0.01em]">
            Audition the puzzle moment
          </h3>
          <p className="mt-1 max-w-[60ch] text-pretty text-sm leading-6 text-admin-muted">
            All six stage previews start from this timestamp and use the
            selected puzzle preset.
          </p>
        </div>

        <button
          aria-pressed={displayedPlayback.mode === "full" && displayedPlayback.status === "playing"}
          className={ADMIN_BUTTON_SECONDARY}
          disabled={!hasPreviewUrl || displayedPlayback.status === "loading"}
          onClick={() =>
            void playPreview({
              label: "Full preview",
              mode: "full",
              startAtSeconds: 0,
            })
          }
          type="button"
        >
          <AdminIcon name="music" size={16} />
          Play full preview
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
        <div className="grid gap-2">
          <label className={ADMIN_LABEL_CLASS} htmlFor="previewStartSeconds">
            Start seconds <span aria-hidden="true">*</span>
          </label>
          <input
            aria-describedby={error ? "previewStartSeconds-help" : undefined}
            aria-invalid={Boolean(error)}
            className={`${ADMIN_INPUT_CLASS} tabular-nums`}
            id="previewStartSeconds"
            min="0"
            name="previewStartSeconds"
            onChange={(event) => onStartSecondsChange(event.target.value)}
            required
            step="0.001"
            type="number"
            value={previewStartSeconds}
          />
          {error ? (
            <span
              className="flex items-start gap-1.5 text-[0.8125rem] font-medium leading-5 text-admin-destructive"
              id="previewStartSeconds-help"
              role="alert"
            >
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                <AdminIcon name="alert" size={14} />
              </span>
              {error}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[-1, -0.1, 0.1, 1].map((delta) => (
            <button
              aria-label={`Adjust start time by ${delta > 0 ? `plus ${delta}` : delta} seconds`}
              className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-2 text-sm font-medium tabular-nums text-admin-text transition-[background-color,border-color,transform] duration-150 hover:bg-admin-surface-strong active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus"
              key={delta}
              onClick={() => adjustStartSeconds(delta)}
              type="button"
            >
              {delta > 0 ? `+${delta}` : delta}s
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-admin-border bg-admin-surface px-3.5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-pretty text-admin-muted" role="status">
          <span className="font-medium text-admin-text">Audio status:</span>{" "}
          {displayedAudioMessage}
        </p>
        <span className={`inline-flex min-h-6 w-fit items-center gap-1.5 rounded-md px-2 text-xs font-medium capitalize ${statusTone}`}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {displayedPlayback.status}
        </span>
      </div>

      {rangeValidation && !rangeValidation.valid ? (
        <AdminAlert className="mt-3" title="Audio range is too short" variant="error">
          {rangeValidation.message}
        </AdminAlert>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {stageDurations.map((durationSeconds, index) => {
          const stage = (index + 1) as StageNumber;
          const isPlayingStage =
            displayedPlayback.mode === "stage" &&
            displayedPlayback.durationSeconds === durationSeconds &&
            displayedPlayback.status === "playing";

          return (
            <button
              aria-pressed={isPlayingStage}
              className={`min-h-14 rounded-lg border px-3 py-2.5 text-start text-sm font-semibold tabular-nums transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:border-admin-border disabled:bg-admin-surface-strong disabled:text-admin-subtle disabled:active:scale-100 ${
                isPlayingStage
                  ? "border-admin-accent bg-admin-accent-soft text-admin-accent"
                  : "border-admin-border bg-admin-surface text-admin-text hover:border-admin-border-strong hover:bg-admin-surface-strong"
              }`}
              disabled={!hasPreviewUrl || displayedPlayback.status === "loading"}
              key={stage}
              onClick={() =>
                void playPreview({
                  durationSeconds,
                  label: `Stage ${stage} (${durationSeconds}s)`,
                  mode: "stage",
                  startAtSeconds: startSeconds,
                })
              }
              type="button"
            >
              <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-admin-subtle">
                Stage {stage}
              </span>
              {durationSeconds}s
            </button>
          );
        })}

        <button
          aria-pressed={displayedPlayback.mode === "reveal" && displayedPlayback.status === "playing"}
          className="min-h-14 rounded-lg border border-admin-accent/20 bg-admin-accent-soft px-3 py-2.5 text-start text-sm font-semibold text-admin-accent transition-[background-color,border-color,transform] duration-150 hover:border-admin-accent/35 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:border-admin-border disabled:bg-admin-surface-strong disabled:text-admin-subtle disabled:active:scale-100"
          disabled={!hasPreviewUrl || displayedPlayback.status === "loading"}
          onClick={() =>
            void playPreview({
              label: "Reveal preview",
              mode: "reveal",
              startAtSeconds: startSeconds,
            })
          }
          type="button"
        >
          <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em]">
            Reveal
          </span>
          Start to end
        </button>
      </div>
    </section>
  );
}

function parsePreviewStartSeconds(value: string) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

function formatTimestampInput(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
