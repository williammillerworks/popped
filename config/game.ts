export const DURATION_PRESETS = {
  classic_v1: {
    description: "The original compact difficulty curve.",
    label: "Classic",
    stageDurations: [0.2, 0.4, 0.8, 1.2, 2.0, 3.0],
  },
  balanced_v1: {
    description: "A little more room through the middle stages.",
    label: "Balanced",
    stageDurations: [0.25, 0.5, 1.0, 1.6, 2.7, 4.0],
  },
  generous_v1: {
    description: "Longer clues with a five-second final stage.",
    label: "Generous",
    stageDurations: [0.3, 0.6, 1.2, 2.0, 3.5, 5.0],
  },
} as const;

export type DurationPresetId = keyof typeof DURATION_PRESETS;

export const DURATION_PRESET_IDS = Object.keys(
  DURATION_PRESETS,
) as DurationPresetId[];
export const DEFAULT_DURATION_PRESET_ID: DurationPresetId = "classic_v1";
export const STAGE_DURATIONS_SECONDS =
  DURATION_PRESETS[DEFAULT_DURATION_PRESET_ID].stageDurations;
export const TOTAL_STAGES = 6;

export type StageDurationSeconds =
  (typeof DURATION_PRESETS)[DurationPresetId]["stageDurations"][number];
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export function isDurationPresetId(
  value: unknown,
): value is DurationPresetId {
  return (
    typeof value === "string" &&
    Object.hasOwn(DURATION_PRESETS, value)
  );
}

export function getDurationPreset(durationPresetId: DurationPresetId) {
  return DURATION_PRESETS[durationPresetId];
}

export function getStageDurationsForPreset(
  durationPresetId: DurationPresetId,
): number[] {
  return [...getDurationPreset(durationPresetId).stageDurations];
}
