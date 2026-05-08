import { NextResponse } from "next/server";

import { STAGE_DURATIONS_SECONDS } from "../../../../config/game";
import {
  DEFAULT_PUZZLE_TIME_ZONE,
  getTodayDateInTimeZone,
} from "../../../../lib/dates";
import { getTodayPuzzleApiResponse } from "../../../../lib/puzzles";
import { SupabaseConfigError } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? getTodayDateInTimeZone();

  try {
    return NextResponse.json(await getTodayPuzzleApiResponse(date));
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json(
        {
          date,
          error: "Supabase is not configured for this environment.",
          puzzle: null,
          stageDurations: [...STAGE_DURATIONS_SECONDS],
          timezone: DEFAULT_PUZZLE_TIME_ZONE,
        },
        { status: 503 },
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        date,
        error: "Unable to load today's puzzle.",
        puzzle: null,
        stageDurations: [...STAGE_DURATIONS_SECONDS],
        timezone: DEFAULT_PUZZLE_TIME_ZONE,
      },
      { status: 500 },
    );
  }
}
