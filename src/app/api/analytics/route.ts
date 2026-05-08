import { NextResponse } from "next/server";

import type { AnalyticsEventName } from "../../../../lib/analytics";

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set<AnalyticsEventName>([
  "answer_revealed",
  "audio_error",
  "game_started",
  "guess_correct",
  "guess_submitted",
  "next_clue_clicked",
  "page_viewed",
  "repeat_used",
  "result_shared",
  "reveal_preview_played",
  "spoiler_hidden",
  "spoiler_shown",
  "stage_played",
]);

type AnalyticsRequestBody = {
  name?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsRequestBody;

    if (!body.name || !ALLOWED_EVENTS.has(body.name as AnalyticsEventName)) {
      return NextResponse.json({ error: "Unknown analytics event." }, { status: 400 });
    }

    const event = {
      name: body.name,
      payload: sanitizePayload(body.payload ?? {}),
      timestamp: body.timestamp ?? new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "development") {
      console.info("[analytics]", event);
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Analytics event could not be recorded." },
      { status: 400 },
    );
  }
}

function sanitizePayload(payload: Record<string, unknown>) {
  return Object.entries(payload).reduce<Record<string, boolean | number | string | null>>(
    (safePayload, [key, value]) => {
      if (
        value === null ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string"
      ) {
        safePayload[key] = value;
      }

      return safePayload;
    },
    {},
  );
}
