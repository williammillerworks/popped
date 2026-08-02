const AUDIO_DURATION_TOLERANCE_SECONDS = 0.01;

export type AudioPreviewRangeValidation = {
  latestStartSeconds: number;
  message: string;
  remainingDurationSeconds: number;
  requiredDurationSeconds: number;
  valid: boolean;
};

export function validateAudioPreviewRange({
  audioDurationSeconds,
  previewStartSeconds,
  stageDurations,
}: {
  audioDurationSeconds: number;
  previewStartSeconds: number;
  stageDurations: readonly number[];
}): AudioPreviewRangeValidation | null {
  if (
    !Number.isFinite(audioDurationSeconds) ||
    audioDurationSeconds <= 0 ||
    !Number.isFinite(previewStartSeconds) ||
    previewStartSeconds < 0 ||
    stageDurations.length === 0 ||
    stageDurations.some(
      (duration) => !Number.isFinite(duration) || duration <= 0,
    )
  ) {
    return null;
  }

  const requiredDurationSeconds = Math.max(...stageDurations);
  const remainingDurationSeconds = Math.max(
    0,
    audioDurationSeconds - previewStartSeconds,
  );
  const latestStartSeconds = Math.max(
    0,
    audioDurationSeconds - requiredDurationSeconds,
  );
  const valid =
    remainingDurationSeconds + AUDIO_DURATION_TOLERANCE_SECONDS >=
    requiredDurationSeconds;

  return {
    latestStartSeconds,
    message: valid
      ? `The selected preset has ${formatSeconds(remainingDurationSeconds)} available.`
      : `This preset needs ${formatSeconds(requiredDurationSeconds)} after the start point, but only ${formatSeconds(remainingDurationSeconds)} remain. Move the start to ${formatSeconds(latestStartSeconds)} or earlier, or choose a shorter preset.`,
    remainingDurationSeconds,
    requiredDurationSeconds,
    valid,
  };
}

function formatSeconds(value: number) {
  return `${Number(value.toFixed(3))}s`;
}
