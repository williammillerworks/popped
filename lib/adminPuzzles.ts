import type { Puzzle } from "../types/puzzle";
import type { PuzzleInsert, PuzzleUpdate } from "../types/database";
import { mapPuzzleRowToPuzzle } from "./puzzleMapping";
import { createSupabaseAdminClient } from "./supabase/server";

const ADMIN_PUZZLE_LIST_LIMIT = 30;
const NUMBERED_PUBLIC_STATUSES = ["published", "scheduled"] as const;

export async function getAdminPuzzleList(): Promise<Puzzle[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .order("date", { ascending: false })
    .limit(ADMIN_PUZZLE_LIST_LIMIT);

  if (error) {
    throw error;
  }

  return data.map(mapPuzzleRowToPuzzle);
}

export async function getAdminPuzzleById(id: string): Promise<Puzzle | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPuzzleRowToPuzzle(data) : null;
}

export async function createAdminPuzzle(puzzle: PuzzleInsert): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const puzzleWithNumber = await assignPuzzleNumberIfNeeded(puzzle);
  const { data, error } = await supabase
    .from("puzzles")
    .insert(puzzleWithNumber)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateAdminPuzzle(
  id: string,
  puzzle: PuzzleUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const currentPuzzle = await getAdminPuzzleById(id);
  const puzzleWithNumber = await assignPuzzleNumberIfNeeded(
    puzzle,
    currentPuzzle?.puzzleNumber ?? null,
  );
  const { error } = await supabase
    .from("puzzles")
    .update(puzzleWithNumber)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function assignPuzzleNumberIfNeeded<
  TPuzzle extends PuzzleInsert | PuzzleUpdate,
>(
  puzzle: TPuzzle,
  existingPuzzleNumber: number | null = null,
): Promise<TPuzzle> {
  if (puzzle.puzzle_number !== undefined) {
    return puzzle;
  }

  if (!isCountablePublicPuzzle(puzzle)) {
    return {
      ...puzzle,
      puzzle_number: null,
    };
  }

  if (existingPuzzleNumber !== null) {
    return {
      ...puzzle,
      puzzle_number: existingPuzzleNumber,
    };
  }

  return {
    ...puzzle,
    puzzle_number: await getNextPublicPuzzleNumber(),
  };
}

function isCountablePublicPuzzle(puzzle: PuzzleInsert | PuzzleUpdate) {
  return (
    puzzle.is_test === false &&
    puzzle.counts_toward_puzzle_number === true &&
    puzzle.status !== undefined &&
    NUMBERED_PUBLIC_STATUSES.includes(
      puzzle.status as (typeof NUMBERED_PUBLIC_STATUSES)[number],
    )
  );
}

async function getNextPublicPuzzleNumber() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puzzles")
    .select("puzzle_number")
    .eq("is_test", false)
    .eq("counts_toward_puzzle_number", true)
    .not("puzzle_number", "is", null)
    .order("puzzle_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.puzzle_number ?? 0) + 1;
}
