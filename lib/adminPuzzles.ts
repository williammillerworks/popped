import type { Puzzle } from "../types/puzzle";
import type { PuzzleEditor } from "../types/puzzle";
import type { PuzzleInsert, PuzzleUpdate } from "../types/database";
import { mapPuzzleRowToPuzzle } from "./puzzleMapping";
import { LEGACY_EDITOR, isMissingEditorSchemaError } from "./editors";
import { createSupabaseAdminClient } from "./supabase/server";

const ADMIN_PUZZLE_LIST_LIMIT = 30;
const NUMBERED_PUBLIC_STATUSES = ["published", "scheduled"] as const;

export async function getAdminPuzzleList(): Promise<Puzzle[]> {
  const supabase = createSupabaseAdminClient();
  const response = await supabase
    .from("puzzles")
    .select("*, editor:editors(id, display_name)")
    .order("date", { ascending: false })
    .limit(ADMIN_PUZZLE_LIST_LIMIT);

  if (!response.error) {
    return response.data.map(mapPuzzleRowToPuzzle);
  }

  if (!isMissingEditorSchemaError(response.error)) {
    throw response.error;
  }

  const legacyResponse = await supabase
    .from("puzzles")
    .select("*")
    .order("date", { ascending: false })
    .limit(ADMIN_PUZZLE_LIST_LIMIT);

  if (legacyResponse.error) {
    throw legacyResponse.error;
  }

  return legacyResponse.data.map(mapPuzzleRowToPuzzle);
}

export async function getAdminPuzzleById(id: string): Promise<Puzzle | null> {
  const supabase = createSupabaseAdminClient();
  const response = await supabase
    .from("puzzles")
    .select("*, editor:editors(id, display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!response.error) {
    return response.data ? mapPuzzleRowToPuzzle(response.data) : null;
  }

  if (!isMissingEditorSchemaError(response.error)) {
    throw response.error;
  }

  const legacyResponse = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (legacyResponse.error) {
    throw legacyResponse.error;
  }

  return legacyResponse.data
    ? mapPuzzleRowToPuzzle(legacyResponse.data)
    : null;
}

export async function getActiveAdminEditors(): Promise<PuzzleEditor[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("editors")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    if (isMissingEditorSchemaError(error)) {
      return [LEGACY_EDITOR];
    }

    throw error;
  }

  return data.map((editor) => ({
    id: editor.id,
    name: editor.display_name,
  }));
}

export async function createAdminPuzzle(puzzle: PuzzleInsert): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const puzzleWithNumber = await assignPuzzleNumberIfNeeded(puzzle);
  const response = await supabase
    .from("puzzles")
    .insert(puzzleWithNumber)
    .select("id")
    .single();

  if (!response.error) {
    return response.data.id;
  }

  if (!isMissingEditorSchemaError(response.error)) {
    throw response.error;
  }

  const legacyResponse = await supabase
    .from("puzzles")
    .insert(omitEditorId(puzzleWithNumber))
    .select("id")
    .single();

  if (legacyResponse.error) {
    throw legacyResponse.error;
  }

  return legacyResponse.data.id;
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
  const response = await supabase
    .from("puzzles")
    .update(puzzleWithNumber)
    .eq("id", id);

  if (!response.error) {
    return;
  }

  if (!isMissingEditorSchemaError(response.error)) {
    throw response.error;
  }

  const legacyResponse = await supabase
    .from("puzzles")
    .update(omitEditorId(puzzleWithNumber))
    .eq("id", id);

  if (legacyResponse.error) {
    throw legacyResponse.error;
  }
}

function omitEditorId<TPuzzle extends PuzzleInsert | PuzzleUpdate>(
  puzzle: TPuzzle,
): TPuzzle {
  const legacyPuzzle = { ...puzzle } as Partial<TPuzzle>;
  delete legacyPuzzle.editor_id;
  return legacyPuzzle as TPuzzle;
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
