"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "../../../../lib/adminAuth";
import {
  createAdminPuzzle,
  updateAdminPuzzle,
} from "../../../../lib/adminPuzzles";
import {
  EMPTY_PUZZLE_FORM_STATE,
  parsePuzzleFormData,
  type PuzzleFormState,
} from "../../../../lib/puzzleForm";
import { SupabaseConfigError } from "../../../../lib/supabase/server";

export async function createPuzzleAction(
  previousState: PuzzleFormState = EMPTY_PUZZLE_FORM_STATE,
  formData: FormData,
): Promise<PuzzleFormState> {
  void previousState;

  await requireAdminSession();

  const parsed = parsePuzzleFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  let puzzleId: string;

  try {
    puzzleId = await createAdminPuzzle(parsed.puzzle);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        errors: {},
        message:
          "Supabase admin config is missing. Add server-only Supabase env vars before creating puzzles.",
        ok: false,
      };
    }

    console.error(error);

    return {
      errors: {},
      message:
        "Could not create puzzle. Check required fields, date uniqueness, and Supabase table constraints.",
      ok: false,
    };
  }

  revalidatePath("/admin/puzzles");
  redirect(`/admin/puzzles/${puzzleId}/edit?saved=created`);
}

export async function updatePuzzleAction(
  puzzleId: string,
  previousState: PuzzleFormState = EMPTY_PUZZLE_FORM_STATE,
  formData: FormData,
): Promise<PuzzleFormState> {
  void previousState;

  await requireAdminSession();

  const parsed = parsePuzzleFormData(formData);

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await updateAdminPuzzle(puzzleId, parsed.puzzle);

    revalidatePath("/admin/puzzles");
    revalidatePath(`/admin/puzzles/${puzzleId}/edit`);

    return {
      errors: {},
      message: "Puzzle saved.",
      ok: true,
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        errors: {},
        message:
          "Supabase admin config is missing. Add server-only Supabase env vars before saving puzzles.",
        ok: false,
      };
    }

    console.error(error);

    return {
      errors: {},
      message:
        "Could not save puzzle. Check required fields, date uniqueness, and Supabase table constraints.",
      ok: false,
    };
  }
}
