import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PuzzleForm,
  type PuzzleFormValues,
} from "../../../../../../components/admin/PuzzleForm";
import {
  AdminAlert,
  ADMIN_BUTTON_SECONDARY,
  AdminIcon,
  AdminPageHeader,
  AdminPanel,
  AdminShell,
} from "../../../../../../components/admin/admin-ui";
import { requireAdminSession } from "../../../../../../lib/adminAuth";
import {
  getActiveAdminEditors,
  getAdminPuzzleById,
} from "../../../../../../lib/adminPuzzles";
import { SupabaseConfigError } from "../../../../../../lib/supabase/server";
import type { Puzzle } from "../../../../../../types/puzzle";
import { signOutAdminAction } from "../../../actions";
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
  const session = await requireAdminSession();
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { editorOptions, errorMessage, puzzle } = await loadPuzzle(id);

  if (errorMessage) {
    return (
      <AdminShell
        active="puzzles"
        email={session.email}
        signOutAction={signOutAdminAction}
      >
        <div className="grid gap-6">
          <AdminPageHeader
            action={
              <Link className={ADMIN_BUTTON_SECONDARY} href="/admin/puzzles">
                <AdminIcon name="arrow-left" size={17} />
                Back to puzzles
              </Link>
            }
            description="The puzzle data could not be opened, so no editable fields are shown."
            eyebrow="Puzzles"
            title="Edit puzzle"
          />
          <AdminPanel className="p-5 sm:p-6">
            <AdminAlert title="Puzzle unavailable" variant="error">
              {errorMessage}
            </AdminAlert>
          </AdminPanel>
        </div>
      </AdminShell>
    );
  }

  if (!puzzle) {
    notFound();
  }

  const action = updatePuzzleAction.bind(null, puzzle.id);

  return (
    <AdminShell
      active="puzzles"
      email={session.email}
      signOutAction={signOutAdminAction}
    >
      <div className="grid gap-6">
        <AdminPageHeader
          action={
            <Link className={ADMIN_BUTTON_SECONDARY} href="/admin/puzzles">
              <AdminIcon name="arrow-left" size={17} />
              Back to puzzles
            </Link>
          }
          description={
            <>
              Editing <strong className="font-semibold text-admin-text">{puzzle.songTitleEnglish}</strong>{" "}
              by <strong className="font-semibold text-admin-text">{puzzle.artistName}</strong>.
              Changes affect the live clue when this puzzle is published.
            </>
          }
          eyebrow={`Puzzle ${puzzle.puzzleNumber ? `#${puzzle.puzzleNumber}` : "draft"}`}
          title="Edit puzzle"
        />

        {resolvedSearchParams?.saved === "created" ? (
          <AdminAlert title="Puzzle created" variant="success">
            The draft is ready. Continue polishing the metadata and audio range
            here.
          </AdminAlert>
        ) : null}

        <PuzzleForm
          action={action}
          editorOptions={editorOptions}
          initialValues={mapPuzzleToFormValues(puzzle)}
          mode="edit"
        />
      </div>
    </AdminShell>
  );
}

async function loadPuzzle(id: string) {
  try {
    const [puzzle, editorOptions] = await Promise.all([
      getAdminPuzzleById(id),
      getActiveAdminEditors(),
    ]);

    return {
      editorOptions,
      errorMessage: "",
      puzzle,
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        editorOptions: [],
        errorMessage:
          "Supabase admin config is missing. Add server-only Supabase env vars before editing puzzles.",
        puzzle: null,
      };
    }

    console.error(error);

    return {
      editorOptions: [],
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
    durationPresetId: puzzle.durationPresetId,
    editorId: puzzle.editorId,
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
