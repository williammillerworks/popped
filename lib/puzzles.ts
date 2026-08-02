import {
  STAGE_DURATIONS_SECONDS,
  getStageDurationsForPreset,
  type DurationPresetId,
} from "../config/game";
import type { Puzzle } from "../types/puzzle";
import {
  DEFAULT_PUZZLE_TIME_ZONE,
  getTodayDateInTimeZone,
} from "./dates";
import { mapPuzzleRowToPuzzle } from "./puzzleMapping";
import { isMissingEditorSchemaError } from "./editors";
import { createSupabaseAdminClient } from "./supabase/server";

export type TodayPuzzleResponse = {
  id: string;
  date: string;
  puzzleNumber: number;
  previewUrl: string;
  previewStartSeconds: number;
  durationPresetId: DurationPresetId;
  stageDurations: number[];
  canonicalAnswerEnglish: string;
  canonicalAnswerKorean?: string | null;
  acceptedAnswers: string[];
  songTitleEnglish: string;
  songTitleKorean?: string | null;
  artistName: string;
  editorName: string;
  albumArtUrl?: string | null;
};

export type TodayPuzzleApiResponse = {
  date: string;
  puzzle: TodayPuzzleResponse | null;
  stageDurations: number[];
  timezone: string;
};

export async function getTodayPuzzleApiResponse(
  date = getTodayDateInTimeZone(),
): Promise<TodayPuzzleApiResponse> {
  const puzzle = await getPublishedPuzzleByDate(date);
  const todayPuzzle = puzzle ? mapPuzzleToTodayPuzzleResponse(puzzle) : null;

  return {
    date,
    puzzle: todayPuzzle,
    stageDurations: todayPuzzle
      ? [...todayPuzzle.stageDurations]
      : [...STAGE_DURATIONS_SECONDS],
    timezone: DEFAULT_PUZZLE_TIME_ZONE,
  };
}

export async function getPublishedPuzzleByDate(
  date: string,
): Promise<Puzzle | null> {
  const supabase = createSupabaseAdminClient();
  const response = await supabase
    .from("puzzles")
    .select("*, editor:editors(id, display_name)")
    .eq("date", date)
    .eq("status", "published")
    .eq("is_test", false)
    .maybeSingle();

  if (!response.error) {
    return response.data ? mapPuzzleRowToPuzzle(response.data) : null;
  }

  if (!isMissingEditorSchemaError(response.error)) {
    throw new Error(
      `Unable to fetch published puzzle: ${response.error.message}`,
    );
  }

  const legacyResponse = await supabase
    .from("puzzles")
    .select("*")
    .eq("date", date)
    .eq("status", "published")
    .eq("is_test", false)
    .maybeSingle();

  if (legacyResponse.error) {
    throw new Error(
      `Unable to fetch published puzzle: ${legacyResponse.error.message}`,
    );
  }

  return legacyResponse.data
    ? mapPuzzleRowToPuzzle(legacyResponse.data)
    : null;
}

export function mapPuzzleToTodayPuzzleResponse(
  puzzle: Puzzle,
): TodayPuzzleResponse {
  if (puzzle.puzzleNumber === null) {
    throw new Error("Published public puzzle is missing a puzzle number.");
  }

  return {
    id: puzzle.id,
    date: puzzle.date,
    puzzleNumber: puzzle.puzzleNumber,
    previewUrl: puzzle.previewUrl,
    previewStartSeconds: puzzle.previewStartSeconds,
    durationPresetId: puzzle.durationPresetId,
    stageDurations: getStageDurationsForPreset(puzzle.durationPresetId),
    canonicalAnswerEnglish: puzzle.canonicalAnswerEnglish,
    canonicalAnswerKorean: puzzle.canonicalAnswerKorean,
    acceptedAnswers: puzzle.acceptedAnswers,
    songTitleEnglish: puzzle.songTitleEnglish,
    songTitleKorean: puzzle.songTitleKorean,
    artistName: puzzle.artistName,
    editorName: puzzle.editorName,
    albumArtUrl: puzzle.albumArtUrl,
  };
}
