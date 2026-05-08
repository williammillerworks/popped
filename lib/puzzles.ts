import { STAGE_DURATIONS_SECONDS } from "../config/game";
import type { Puzzle } from "../types/puzzle";
import {
  DEFAULT_PUZZLE_TIME_ZONE,
  getTodayDateInTimeZone,
} from "./dates";
import { mapPuzzleRowToPuzzle } from "./puzzleMapping";
import { createSupabaseAdminClient } from "./supabase/server";

export type TodayPuzzleResponse = {
  id: string;
  date: string;
  puzzleNumber: number;
  previewUrl: string;
  previewStartSeconds: number;
  stageDurations: number[];
  canonicalAnswerEnglish: string;
  canonicalAnswerKorean?: string | null;
  acceptedAnswers: string[];
  songTitleEnglish: string;
  songTitleKorean?: string | null;
  artistName: string;
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

  return {
    date,
    puzzle: puzzle ? mapPuzzleToTodayPuzzleResponse(puzzle) : null,
    stageDurations: [...STAGE_DURATIONS_SECONDS],
    timezone: DEFAULT_PUZZLE_TIME_ZONE,
  };
}

export async function getPublishedPuzzleByDate(
  date: string,
): Promise<Puzzle | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("date", date)
    .eq("status", "published")
    .eq("is_test", false)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch published puzzle: ${error.message}`);
  }

  return data ? mapPuzzleRowToPuzzle(data) : null;
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
    stageDurations: [...STAGE_DURATIONS_SECONDS],
    canonicalAnswerEnglish: puzzle.canonicalAnswerEnglish,
    canonicalAnswerKorean: puzzle.canonicalAnswerKorean,
    acceptedAnswers: puzzle.acceptedAnswers,
    songTitleEnglish: puzzle.songTitleEnglish,
    songTitleKorean: puzzle.songTitleKorean,
    artistName: puzzle.artistName,
    albumArtUrl: puzzle.albumArtUrl,
  };
}
