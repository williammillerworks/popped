const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const LOADING_MESSAGE_V1_START_DATE = "2026-08-01";
const MIN_LOADING_COMPLETION_DURATION_MS = 720;
const MAX_LOADING_COMPLETION_DURATION_MS = 1100;

export const LOADING_MESSAGES_V1 = [
  "Warming up the lightsticks",
  "Syncing the fan chant",
  "Setting the stage",
  "Checking the encore list",
  "Waiting outside the green room",
  "Looking for your bias",
] as const;

export function getDailyLoadingMessage(date: string): string {
  const dayOffset =
    getUtcDayNumber(date) - getUtcDayNumber(LOADING_MESSAGE_V1_START_DATE);
  const messageIndex = positiveModulo(dayOffset, LOADING_MESSAGES_V1.length);

  return LOADING_MESSAGES_V1[messageIndex];
}

export function getLoadingCompletionDuration(progress: number): number {
  const normalizedProgress = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;

  return Math.round(
    MIN_LOADING_COMPLETION_DURATION_MS +
      (MAX_LOADING_COMPLETION_DURATION_MS -
        MIN_LOADING_COMPLETION_DURATION_MS) *
        (1 - normalizedProgress),
  );
}

function getUtcDayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error(`Invalid loading message date: ${date}`);
  }

  const [, year, month, day] = match;

  return Math.floor(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) /
      MILLISECONDS_PER_DAY,
  );
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
