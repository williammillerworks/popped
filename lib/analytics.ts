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

type AnalyticsEnvelope = {
  name: AnalyticsEventName;
  payload: Record<string, AnalyticsValue>;
  timestamp: string;
};

type VercelAnalyticsWindow = Window & {
  va?: (
    action: "event",
    name: AnalyticsEventName,
    payload?: Record<string, AnalyticsValue>,
  ) => void;
};

export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const sanitizedPayload = sanitizePayload(payload);
    const analyticsWindow = window as VercelAnalyticsWindow;

    if (analyticsWindow.va) {
      analyticsWindow.va("event", name, sanitizedPayload);
      return;
    }

    const envelope: AnalyticsEnvelope = {
      name,
      payload: sanitizedPayload,
      timestamp: new Date().toISOString(),
    };
    const body = JSON.stringify(envelope);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }

    void fetch("/api/analytics", {
      body,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      method: "POST",
    });
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
