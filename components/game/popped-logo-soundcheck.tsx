"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import {
  configurePoppedLogoPlaybackAudioSession,
  getPoppedLogoVisualStartDelayMs,
  getPoppedLogoLetterMotion,
  POPPED_LOGO_LETTERS,
  POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
  POPPED_LOGO_SOUND_CHECK_SCHEDULE_LEAD_MS,
  POPPED_LOGO_SOUND_CHECK_TIMELINE_MS,
} from "../../lib/popped-logo-soundcheck";

import styles from "./popped-logo-soundcheck.module.css";

const AUTO_VISUAL_FALLBACK_MS = 600;
const MANUAL_VISUAL_FALLBACK_MS = 1500;

type SoundcheckAudioState = {
  bufferPromise: Promise<AudioBuffer | null>;
  context: AudioContext;
  disposed: boolean;
  source: AudioBufferSourceNode | null;
};

type SoundcheckRunMode = "automatic" | "manual";

export type PoppedLogoSoundcheckHandle = {
  restart: () => void;
};

type PoppedLogoSoundcheckProps = {
  autoPlay?: boolean;
  className?: string;
  eager?: boolean;
};

type SoundcheckButtonProps = {
  className?: string;
  onActivate: () => void;
};

export const PoppedLogoSoundcheck = forwardRef<
  PoppedLogoSoundcheckHandle,
  PoppedLogoSoundcheckProps
>(function PoppedLogoSoundcheck(
  { autoPlay = false, className, eager = false },
  ref,
) {
  const activeAnimationsRef = useRef<Animation[]>([]);
  const audioStateRef = useRef<SoundcheckAudioState | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const motionPreferenceRef = useRef<MediaQueryList | null>(null);
  const runIdRef = useRef(0);
  const visualFallbackTimerRef = useRef<number | null>(null);
  const visualStartedRunRef = useRef(0);

  const cancelVisualTimeline = useCallback(() => {
    if (visualFallbackTimerRef.current !== null) {
      window.clearTimeout(visualFallbackTimerRef.current);
      visualFallbackTimerRef.current = null;
    }

    activeAnimationsRef.current.forEach((animation) => animation.cancel());
    activeAnimationsRef.current = [];
  }, []);

  const stopActiveAudio = useCallback(() => {
    const audioState = audioStateRef.current;
    const source = audioState?.source;

    if (!source || !audioState) {
      return;
    }

    audioState.source = null;

    try {
      source.stop();
    } catch {
      // A source that has already ended cannot be stopped again in WebKit.
    }

    source.disconnect();
  }, []);

  const startVisualTimeline = useCallback(
    (runId: number, startDelayMs = 0) => {
      if (
        runId !== runIdRef.current ||
        visualStartedRunRef.current === runId
      ) {
        return;
      }

      if (visualFallbackTimerRef.current !== null) {
        window.clearTimeout(visualFallbackTimerRef.current);
        visualFallbackTimerRef.current = null;
      }

      visualStartedRunRef.current = runId;

      if (motionPreferenceRef.current?.matches) {
        return;
      }

      POPPED_LOGO_SOUND_CHECK_TIMELINE_MS.forEach((onsetMs, letterIndex) => {
        const letter = letterRefs.current[letterIndex];

        if (!letter || typeof letter.animate !== "function") {
          return;
        }

        const motion = getPoppedLogoLetterMotion(letterIndex);
        const animation = letter.animate(motion.keyframes, {
          delay: startDelayMs + onsetMs,
          duration: motion.durationMs,
        });

        activeAnimationsRef.current.push(animation);
      });
    },
    [],
  );

  const restartSoundcheck = useCallback(
    (mode: SoundcheckRunMode) => {
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;

      cancelVisualTimeline();
      stopActiveAudio();

      const audioState = audioStateRef.current;

      if (!audioState || audioState.disposed) {
        startVisualTimeline(runId);
        return;
      }

      configurePoppedLogoPlaybackAudioSession(navigator);

      const fallbackDelay =
        mode === "automatic"
          ? AUTO_VISUAL_FALLBACK_MS
          : MANUAL_VISUAL_FALLBACK_MS;

      visualFallbackTimerRef.current = window.setTimeout(() => {
        startVisualTimeline(runId);
      }, fallbackDelay);

      const resumePromise =
        audioState.context.state === "running"
          ? Promise.resolve()
          : audioState.context.resume();

      void Promise.all([resumePromise, audioState.bufferPromise])
        .then(([, audioBuffer]) => {
          if (
            runId !== runIdRef.current ||
            audioState.disposed ||
            visualStartedRunRef.current === runId ||
            audioState.context.state !== "running" ||
            !audioBuffer
          ) {
            if (runId === runIdRef.current && !audioBuffer) {
              startVisualTimeline(runId);
            }
            return;
          }

          const source = audioState.context.createBufferSource();
          const startTimeSeconds =
            audioState.context.currentTime +
            POPPED_LOGO_SOUND_CHECK_SCHEDULE_LEAD_MS / 1000;

          try {
            source.buffer = audioBuffer;
            source.connect(audioState.context.destination);
            source.addEventListener(
              "ended",
              () => {
                if (audioState.source === source) {
                  audioState.source = null;
                }
                source.disconnect();
              },
              { once: true },
            );
            audioState.source = source;
            source.start(startTimeSeconds);
          } catch {
            if (audioState.source === source) {
              audioState.source = null;
            }
            source.disconnect();
            startVisualTimeline(runId);
            return;
          }

          let outputPerformanceTimeMs: number | undefined;
          let outputTimeSeconds: number | undefined;

          try {
            if (typeof audioState.context.getOutputTimestamp === "function") {
              const outputTimestamp = audioState.context.getOutputTimestamp();
              outputPerformanceTimeMs = outputTimestamp.performanceTime;
              outputTimeSeconds = outputTimestamp.contextTime;
            }
          } catch {
            // Older WebKit builds expose the method before it is usable.
          }

          const visualStartDelayMs = getPoppedLogoVisualStartDelayMs({
            contextTimeSeconds: audioState.context.currentTime,
            currentTimeSeconds: audioState.context.currentTime,
            outputPerformanceTimeMs,
            outputTimeSeconds,
            performanceNowMs: performance.now(),
            startTimeSeconds,
          });

          startVisualTimeline(runId, visualStartDelayMs);
        })
        .catch(() => startVisualTimeline(runId));
    },
    [cancelVisualTimeline, startVisualTimeline, stopActiveAudio],
  );

  useImperativeHandle(
    ref,
    () => ({
      restart: () => restartSoundcheck("manual"),
    }),
    [restartSoundcheck],
  );

  useEffect(() => {
    const abortController = new AbortController();
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    let audioState: SoundcheckAudioState | null = null;

    if (AudioContextConstructor) {
      const context = new AudioContextConstructor();
      const bufferPromise = fetch(POPPED_LOGO_SOUND_CHECK_AUDIO_SRC, {
        cache: "force-cache",
        signal: abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Soundcheck audio could not load");
          }
          return response.arrayBuffer();
        })
        .then((encodedAudio) => context.decodeAudioData(encodedAudio))
        .catch(() => null);

      audioState = {
        bufferPromise,
        context,
        disposed: false,
        source: null,
      };
    }

    audioStateRef.current = audioState;
    motionPreferenceRef.current = motionPreference;

    function handleMotionPreferenceChange(event: MediaQueryListEvent) {
      if (event.matches) {
        cancelVisualTimeline();
      }
    }

    motionPreference.addEventListener("change", handleMotionPreferenceChange);

    if (autoPlay) {
      restartSoundcheck("automatic");
    }

    return () => {
      runIdRef.current += 1;
      cancelVisualTimeline();
      stopActiveAudio();
      motionPreference.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      motionPreferenceRef.current = null;
      abortController.abort();

      if (audioState) {
        audioState.disposed = true;
        void audioState.context.close().catch(() => undefined);
      }

      audioStateRef.current = null;
    };
  }, [
    autoPlay,
    cancelVisualTimeline,
    restartSoundcheck,
    stopActiveAudio,
  ]);

  return (
    <div
      aria-label="POPPED"
      className={`${styles.logo}${className ? ` ${className}` : ""}`}
      role="img"
    >
      {POPPED_LOGO_LETTERS.map((letter, letterIndex) => (
        <span
          className={styles.letter}
          key={letter.src}
          ref={(node) => {
            letterRefs.current[letterIndex] = node;
          }}
        >
          <Image
            alt=""
            aria-hidden="true"
            className={styles.letterImage}
            draggable={false}
            fetchPriority={eager ? "high" : "auto"}
            height={letter.height}
            loading={eager ? "eager" : "lazy"}
            src={letter.src}
            width={letter.width}
          />
        </span>
      ))}
    </div>
  );
});

export function SoundcheckButton({
  className,
  onActivate,
}: SoundcheckButtonProps) {
  return (
    <button
      className={`${styles.button}${className ? ` ${className}` : ""}`}
      onClick={onActivate}
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className={styles.replayIcon}
        draggable={false}
        height={30}
        src="/icons/soundcheck-replay.svg"
        unoptimized
        width={30}
      />
      <span>Soundcheck</span>
    </button>
  );
}
