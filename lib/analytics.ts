import posthog from "posthog-js";

export type AnalyticsEventName =
  | "answer_revealed"
  | "audio_error"
  | "game_started"
  | "guess_correct"
  | "guess_submitted"
  | "next_clue_clicked"
  | "page_viewed"
  | "repeat_used"
  | "result_shared"
  | "reveal_preview_played"
  | "spoiler_hidden"
  | "spoiler_shown"
  | "stage_played";

type AnalyticsValue = boolean | number | string | null;
export type AnalyticsPayload = Record<string, AnalyticsValue | undefined>;

export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    posthog.capture(name, sanitizePayload(payload));
  } catch {
    // Analytics should never block the game.
  }
}

function sanitizePayload(payload: AnalyticsPayload) {
  return Object.entries(payload).reduce<Record<string, AnalyticsValue>>(
    (safePayload, [key, value]) => {
      if (value !== undefined) {
        safePayload[key] = value;
      }

      return safePayload;
    },
    {},
  );
}
