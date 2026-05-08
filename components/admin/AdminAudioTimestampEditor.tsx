"use client";

import { useEffect, useRef, useState } from "react";

import {
  STAGE_DURATIONS_SECONDS,
  type StageNumber,
} from "../../config/game";
import { isAutoplayBlocked, seekAudio } from "../../lib/audioPlayback";

type PlaybackMode = "full" | "stage" | "reveal";
type PlaybackStatus = "idle" | "loading" | "playing" | "finished" | "error";

type PlaybackState = {
  durationSeconds?: number;
  label: string;
  mode: PlaybackMode;
  status: PlaybackStatus;
};

type AdminAudioTimestampEditorProps = {
  error?: string;
  onStartSecondsChange: (value: string) => void;
  previewStartSeconds: string;
  previewUrl: string;
};

const IDLE_PLAYBACK: PlaybackState = {
  label: "Audio preview ready.",
  mode: "stage",
  status: "idle",
};

export function AdminAudioTimestampEditor({
  error,
  onStartSecondsChange,
  previewStartSeconds,
  previewUrl,
}: AdminAudioTimestampEditorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activePlayIdRef = useRef(0);
  const stopIntervalRef = useRef<number | null>(null);
  const [audioMessage, setAudioMessage] = useState(
    "Add a preview URL, then audition the timestamp.",
  );
  const [playback, setPlayback] = useState<PlaybackState>(IDLE_PLAYBACK);

  const startSeconds = parsePreviewStartSeconds(previewStartSeconds);
  const hasPreviewUrl = previewUrl.trim().length > 0;
  const displayedAudioMessage = hasPreviewUrl
    ? audioMessage
    : "Add a preview URL, then audition the timestamp.";
  const displayedPlayback = hasPreviewUrl ? playback : IDLE_PLAYBACK;

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

    function handleError() {
      clearStopInterval();
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
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    audio.load();

    return () => {
      clearStopInterval();
      audio.pause();
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [hasPreviewUrl, previewUrl]);

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

  return (
    <section className="rounded-3xl border border-[#211b17]/10 bg-[#f7f1e8] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
            Timestamp Editor
          </p>
          <h3 className="text-xl font-black tracking-[-0.04em]">
            Audition the puzzle moment
          </h3>
          <p className="text-sm leading-6 text-[#5f5148]">
            All stage previews start from this timestamp. Stage durations remain
            fixed globally.
          </p>
        </div>

        <button
          className="h-10 rounded-full border border-[#211b17]/15 px-4 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
          Play full preview
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-end">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
            Preview start seconds *
          </span>
          <input
            className="h-11 w-full rounded-2xl border border-[#211b17]/15 bg-white px-4 text-sm font-bold text-[#211b17] outline-none transition focus:border-[#b05f3c] focus:ring-4 focus:ring-[#b05f3c]/15"
            min="0"
            name="previewStartSeconds"
            onChange={(event) => onStartSecondsChange(event.target.value)}
            required
            step="0.001"
            type="number"
            value={previewStartSeconds}
          />
          {error ? (
            <span className="block text-xs font-bold text-[#9d331e]">
              {error}
            </span>
          ) : null}
        </label>

        <div className="grid grid-cols-4 gap-2">
          {[-1, -0.1, 0.1, 1].map((delta) => (
            <button
              className="h-11 rounded-full bg-white px-3 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5"
              key={delta}
              onClick={() => adjustStartSeconds(delta)}
              type="button"
            >
              {delta > 0 ? `+${delta}` : delta}s
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#211b17]">
        <span className="text-[#8a5f3b]">Audio status: </span>
        {displayedAudioMessage}
        <span className="ml-2 rounded-full bg-[#211b17] px-2 py-1 text-xs uppercase tracking-[0.12em] text-[#fffaf1]">
          {displayedPlayback.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {STAGE_DURATIONS_SECONDS.map((durationSeconds, index) => {
          const stage = (index + 1) as StageNumber;

          return (
            <button
              className="rounded-2xl bg-[#211b17] px-3 py-3 text-left text-sm font-black text-[#fffaf1] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
              <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-[#e4aa73]">
                Stage {stage}
              </span>
              {durationSeconds}s
            </button>
          );
        })}

        <button
          className="rounded-2xl bg-[#e4aa73] px-3 py-3 text-left text-sm font-black text-[#211b17] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
          <span className="block text-[0.65rem] uppercase tracking-[0.14em]">
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
