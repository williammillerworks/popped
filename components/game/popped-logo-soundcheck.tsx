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
  getPoppedLogoLetterMotion,
  POPPED_LOGO_LETTERS,
  POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
  POPPED_LOGO_SOUND_CHECK_TIMELINE_MS,
} from "../../lib/popped-logo-soundcheck";

import styles from "./popped-logo-soundcheck.module.css";

const VISUAL_START_FALLBACK_MS = 600;

type ActivePlayingListener = {
  audio: HTMLAudioElement;
  listener: () => void;
};

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const motionPreferenceRef = useRef<MediaQueryList | null>(null);
  const pendingTimersRef = useRef<number[]>([]);
  const playingListenerRef = useRef<ActivePlayingListener | null>(null);
  const runIdRef = useRef(0);
  const visualFallbackTimerRef = useRef<number | null>(null);
  const visualStartedRunRef = useRef(0);

  const clearPlayingListener = useCallback(() => {
    const activeListener = playingListenerRef.current;

    if (!activeListener) {
      return;
    }

    activeListener.audio.removeEventListener(
      "playing",
      activeListener.listener,
    );
    playingListenerRef.current = null;
  }, []);

  const cancelVisualTimeline = useCallback(() => {
    pendingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    pendingTimersRef.current = [];

    if (visualFallbackTimerRef.current !== null) {
      window.clearTimeout(visualFallbackTimerRef.current);
      visualFallbackTimerRef.current = null;
    }

    activeAnimationsRef.current.forEach((animation) => animation.cancel());
    activeAnimationsRef.current = [];
  }, []);

  const startVisualTimeline = useCallback((runId: number) => {
    if (
      runId !== runIdRef.current ||
      visualStartedRunRef.current === runId
    ) {
      return;
    }

    visualStartedRunRef.current = runId;

    if (motionPreferenceRef.current?.matches) {
      return;
    }

    function animateLetter(letterIndex: number) {
      if (
        runId !== runIdRef.current ||
        motionPreferenceRef.current?.matches
      ) {
        return;
      }

      const letter = letterRefs.current[letterIndex];

      if (!letter || typeof letter.animate !== "function") {
        return;
      }

      const motion = getPoppedLogoLetterMotion(letterIndex);
      const animation = letter.animate(motion.keyframes, {
        duration: motion.durationMs,
      });

      activeAnimationsRef.current.push(animation);
    }

    POPPED_LOGO_SOUND_CHECK_TIMELINE_MS.forEach((onsetMs, letterIndex) => {
      if (onsetMs === 0) {
        animateLetter(letterIndex);
        return;
      }

      const timer = window.setTimeout(
        () => animateLetter(letterIndex),
        onsetMs,
      );
      pendingTimersRef.current.push(timer);
    });
  }, []);

  const restartSoundcheck = useCallback(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    clearPlayingListener();
    cancelVisualTimeline();

    const audio = audioRef.current;

    if (!audio) {
      startVisualTimeline(runId);
      return;
    }

    audio.pause();

    try {
      audio.currentTime = 0;
    } catch {
      // Safari can defer seeking until the local file has metadata.
    }

    const startVisuals = () => {
      if (runId !== runIdRef.current) {
        return;
      }

      clearPlayingListener();

      if (visualFallbackTimerRef.current !== null) {
        window.clearTimeout(visualFallbackTimerRef.current);
        visualFallbackTimerRef.current = null;
      }

      startVisualTimeline(runId);
    };
    const handlePlaying = () => startVisuals();

    playingListenerRef.current = { audio, listener: handlePlaying };
    audio.addEventListener("playing", handlePlaying, { once: true });

    visualFallbackTimerRef.current = window.setTimeout(() => {
      audio.pause();
      startVisuals();
    }, VISUAL_START_FALLBACK_MS);

    try {
      void audio.play().catch(() => startVisuals());
    } catch {
      startVisuals();
    }
  }, [cancelVisualTimeline, clearPlayingListener, startVisualTimeline]);

  useImperativeHandle(
    ref,
    () => ({
      restart: restartSoundcheck,
    }),
    [restartSoundcheck],
  );

  useEffect(() => {
    const audio = new Audio(POPPED_LOGO_SOUND_CHECK_AUDIO_SRC);
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    audio.preload = "auto";
    audioRef.current = audio;
    motionPreferenceRef.current = motionPreference;
    audio.load();

    function handleMotionPreferenceChange(event: MediaQueryListEvent) {
      if (event.matches) {
        cancelVisualTimeline();
      }
    }

    motionPreference.addEventListener("change", handleMotionPreferenceChange);

    if (autoPlay) {
      restartSoundcheck();
    }

    return () => {
      runIdRef.current += 1;
      clearPlayingListener();
      cancelVisualTimeline();
      motionPreference.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      motionPreferenceRef.current = null;

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [
    autoPlay,
    cancelVisualTimeline,
    clearPlayingListener,
    restartSoundcheck,
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
