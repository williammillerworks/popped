import { notFound } from "next/navigation";

import {
  PuzzleForm,
  type PuzzleFormValues,
} from "../../../../../../components/admin/PuzzleForm";
import { requireAdminSession } from "../../../../../../lib/adminAuth";
import { getAdminPuzzleById } from "../../../../../../lib/adminPuzzles";
import { SupabaseConfigError } from "../../../../../../lib/supabase/server";
import type { Puzzle } from "../../../../../../types/puzzle";
import { updatePuzzleAction } from "../../actions";

export const dynamic = "force-dynamic";

type EditPuzzlePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
  }>;
};

export default async function EditPuzzlePage({
  params,
  searchParams,
}: EditPuzzlePageProps) {
  await requireAdminSession();

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { errorMessage, puzzle } = await loadPuzzle(id);

  if (errorMessage) {
    return (
      <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <div className="space-y-3">
            <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
              Admin
            </p>
            <h1 className="text-4xl font-black tracking-[-0.05em]">
              Edit Puzzle
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#d8c8b7]">
              {errorMessage}
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!puzzle) {
    notFound();
  }

  const action = updatePuzzleAction.bind(null, puzzle.id);

  return (
    <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="space-y-3">
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
            Admin
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em]">
            Edit Puzzle
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#d8c8b7]">
            Editing {puzzle.songTitleEnglish} by {puzzle.artistName}.
          </p>
          {resolvedSearchParams?.saved === "created" ? (
            <p className="inline-flex rounded-full bg-[#d9f8c4] px-4 py-2 text-sm font-black text-[#244512]">
              Puzzle created. Keep polishing it here.
            </p>
          ) : null}
        </div>

        <PuzzleForm
          action={action}
          initialValues={mapPuzzleToFormValues(puzzle)}
          mode="edit"
        />
      </section>
    </main>
  );
}

async function loadPuzzle(id: string) {
  try {
    return {
      errorMessage: "",
      puzzle: await getAdminPuzzleById(id),
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        errorMessage:
          "Supabase admin config is missing. Add server-only Supabase env vars before editing puzzles.",
        puzzle: null,
      };
    }

    console.error(error);

    return {
      errorMessage:
        "Could not load this puzzle right now. Check the database connection, then refresh.",
      puzzle: null,
    };
  }
}

function mapPuzzleToFormValues(puzzle: Puzzle): PuzzleFormValues {
  return {
    acceptedAnswers: puzzle.acceptedAnswers.join("\n"),
    albumArtUrl: puzzle.albumArtUrl ?? "",
    artistName: puzzle.artistName,
    canonicalAnswerEnglish: puzzle.canonicalAnswerEnglish,
    canonicalAnswerKorean: puzzle.canonicalAnswerKorean ?? "",
    countsTowardPuzzleNumber: puzzle.countsTowardPuzzleNumber,
    date: puzzle.date,
    difficulty: puzzle.difficulty ?? "",
    isTest: puzzle.isTest,
    notes: puzzle.notes ?? "",
    previewStartSeconds: String(puzzle.previewStartSeconds),
    previewUrl: puzzle.previewUrl,
    songTitleEnglish: puzzle.songTitleEnglish,
    songTitleKorean: puzzle.songTitleKorean ?? "",
    source: puzzle.source,
    sourceCountry: puzzle.sourceCountry ?? "",
    sourceTrackId: puzzle.sourceTrackId ?? "",
    status: puzzle.status,
    tags: puzzle.tags?.join("\n") ?? "",
  };
}
