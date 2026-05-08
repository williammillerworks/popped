export const STAGE_DURATIONS_SECONDS = [
  0.2,
  0.4,
  0.8,
  1.0,
  1.5,
  2.0,
  3.0,
] as const;

export const TOTAL_STAGES = STAGE_DURATIONS_SECONDS.length;

export type StageDurationSeconds = (typeof STAGE_DURATIONS_SECONDS)[number];
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
