export const POPPED_LOGO_SOUND_CHECK_AUDIO_SRC =
  "/audio/popped-logo-sound-check.wav";

export const POPPED_LOGO_SOUND_CHECK_TIMELINE_MS = [
  0, 190, 410, 515, 620, 760,
] as const;

export const POPPED_LOGO_SOUND_CHECK_SCHEDULE_LEAD_MS = 60;

type PoppedLogoAudioSessionNavigator = {
  audioSession?: {
    type: string;
  };
};

export function configurePoppedLogoPlaybackAudioSession(
  navigatorLike: Navigator & PoppedLogoAudioSessionNavigator,
) {
  const audioSession = navigatorLike.audioSession;

  if (!audioSession) {
    return false;
  }

  try {
    audioSession.type = "playback";
    return audioSession.type === "playback";
  } catch {
    return false;
  }
}

type PoppedLogoAudioClock = {
  contextTimeSeconds: number;
  currentTimeSeconds: number;
  outputPerformanceTimeMs?: number;
  outputTimeSeconds?: number;
  performanceNowMs: number;
  startTimeSeconds: number;
};

export function getPoppedLogoVisualStartDelayMs({
  contextTimeSeconds,
  currentTimeSeconds,
  outputPerformanceTimeMs,
  outputTimeSeconds,
  performanceNowMs,
  startTimeSeconds,
}: PoppedLogoAudioClock) {
  if (
    outputPerformanceTimeMs !== undefined &&
    outputPerformanceTimeMs > 0 &&
    outputTimeSeconds !== undefined &&
    Number.isFinite(outputTimeSeconds)
  ) {
    return Math.max(
      0,
      outputPerformanceTimeMs +
        (startTimeSeconds - outputTimeSeconds) * 1000 -
        performanceNowMs,
    );
  }

  return Math.max(
    0,
    (startTimeSeconds - Math.max(contextTimeSeconds, currentTimeSeconds)) *
      1000,
  );
}

export const POPPED_LOGO_LETTERS = [
  {
    height: 192,
    src: "/images/popped-logo/letter-1-p.png",
    width: 149,
  },
  {
    height: 192,
    src: "/images/popped-logo/letter-2-o.png",
    width: 175,
  },
  {
    height: 192,
    src: "/images/popped-logo/letter-3-p.png",
    width: 152,
  },
  {
    height: 192,
    src: "/images/popped-logo/letter-4-p.png",
    width: 152,
  },
  {
    height: 192,
    src: "/images/popped-logo/letter-5-e.png",
    width: 152,
  },
  {
    height: 192,
    src: "/images/popped-logo/letter-6-d.png",
    width: 159,
  },
] as const;

export type PoppedLogoLetterMotion = {
  durationMs: number;
  keyframes: Keyframe[];
};

const LAST_LETTER_INDEX = POPPED_LOGO_LETTERS.length - 1;
const RISE_EASING = "cubic-bezier(.2,.8,.25,1)";
const SETTLE_EASING = "cubic-bezier(.22,.75,.25,1)";

export function getPoppedLogoLetterMotion(
  letterIndex: number,
): PoppedLogoLetterMotion {
  if (letterIndex < 0 || letterIndex > LAST_LETTER_INDEX) {
    throw new RangeError(`Invalid POPPED logo letter index: ${letterIndex}`);
  }

  const isFinalLetter = letterIndex === LAST_LETTER_INDEX;
  const durationMs = isFinalLetter ? 260 : 235;
  const riseDistance = isFinalLetter ? -8 : -7;

  return {
    durationMs,
    keyframes: [
      {
        easing: RISE_EASING,
        offset: 0,
        transform: "translate3d(0, 0, 0) scale(1)",
      },
      {
        easing: SETTLE_EASING,
        offset: 70 / durationMs,
        transform: `translate3d(0, ${riseDistance}px, 0) scaleX(.985) scaleY(1.025)`,
      },
      {
        easing: SETTLE_EASING,
        offset: 155 / durationMs,
        transform: "translate3d(0, 2px, 0) scaleX(1.012) scaleY(.988)",
      },
      {
        offset: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
      },
    ],
  };
}
