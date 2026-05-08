import Link from "next/link";

import { requireAdminSession } from "../../../../lib/adminAuth";
import { getAdminPuzzleList } from "../../../../lib/adminPuzzles";
import { SupabaseConfigError } from "../../../../lib/supabase/server";
import { signOutAdminAction } from "../actions";
import type { Puzzle, PuzzleStatus } from "../../../../types/puzzle";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlesPage() {
  const session = await requireAdminSession();
  const { errorMessage, puzzles } = await loadPuzzles();
  const summary = getPuzzleSummary(puzzles);
  const missingDays = getMissingPublicPuzzleDays(puzzles);

  return (
    <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
              Admin
            </p>
            <h1 className="text-4xl font-black tracking-[-0.05em]">
              Puzzle Studio
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#d8c8b7]">
              Create, edit, and review POPPED puzzle drafts. Signed in as{" "}
              <span className="font-bold text-[#fffaf1]">{session.email}</span>.
            </p>
          </div>

          <form action={signOutAdminAction}>
            <button
              className="h-11 rounded-full border border-white/15 px-5 text-sm font-black text-[#fffaf1] transition hover:-translate-y-0.5 hover:bg-white/10"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa73]">
              Create/Edit
            </p>
            <p className="mt-2 text-sm font-semibold text-[#d8c8b7]">
              Test puzzles default to not counting toward public numbering.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#fffaf1] px-5 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5"
            href="/admin/puzzles/new"
          >
            Create puzzle
          </Link>
        </div>

        {errorMessage ? (
          <p className="rounded-3xl bg-[#4b241b] px-5 py-4 text-sm font-bold text-[#ffd9ca]">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <SummaryCard label="All puzzles" value={puzzles.length} />
          <SummaryCard label="Published" value={summary.published} />
          <SummaryCard label="Scheduled" value={summary.scheduled} />
          <SummaryCard label="Tests" value={summary.tests} />
        </div>

        {missingDays.length > 0 ? (
          <section className="rounded-3xl border border-[#e4aa73]/30 bg-[#33251d] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa73]">
                  Missing Days
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#d8c8b7]">
                  Real scheduled/published puzzles are missing for these dates
                  in the current list range.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingDays.map((date) => (
                  <span
                    className="rounded-full bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#211b17]"
                    key={date}
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10">
          <div className="grid grid-cols-[1fr_auto] gap-3 bg-white/[0.04] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#e4aa73] lg:grid-cols-[7rem_4rem_1.4fr_1fr_7rem_8rem_7rem_auto]">
            <span>Date</span>
            <span className="hidden lg:block">#</span>
            <span>Song</span>
            <span className="hidden lg:block">Artist</span>
            <span className="hidden lg:block">Status</span>
            <span className="hidden lg:block">State</span>
            <span className="hidden lg:block">Difficulty</span>
            <span>Edit</span>
          </div>

          {puzzles.length > 0 ? (
            <div className="divide-y divide-white/10">
              {puzzles.map((puzzle) => (
                <article
                  className={`grid grid-cols-[1fr_auto] gap-4 px-5 py-4 text-sm lg:grid-cols-[7rem_4rem_1.4fr_1fr_7rem_8rem_7rem_auto] lg:items-center ${
                    puzzle.isTest ? "bg-[#2b211d]" : ""
                  }`}
                  key={puzzle.id}
                >
                  <div className="font-mono text-[#d8c8b7]">
                    {puzzle.date}
                    <span className="mt-2 block lg:hidden">
                      <PuzzleNumberBadge puzzle={puzzle} />
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <PuzzleNumberBadge puzzle={puzzle} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#fffaf1]">
                      {puzzle.songTitleEnglish}
                    </p>
                    <p className="truncate font-medium text-[#d8c8b7] lg:hidden">
                      {puzzle.artistName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
                      <StatusBadge status={puzzle.status} />
                      <CountingBadge puzzle={puzzle} />
                      <DifficultyBadge difficulty={puzzle.difficulty} />
                    </div>
                  </div>
                  <p className="hidden truncate font-semibold text-[#d8c8b7] lg:block">
                    {puzzle.artistName}
                  </p>
                  <div className="hidden lg:block">
                    <StatusBadge status={puzzle.status} />
                  </div>
                  <div className="hidden lg:block">
                    <CountingBadge puzzle={puzzle} />
                  </div>
                  <div className="hidden lg:block">
                    <DifficultyBadge difficulty={puzzle.difficulty} />
                  </div>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-black text-[#fffaf1] transition hover:-translate-y-0.5 hover:bg-white/10"
                    href={`/admin/puzzles/${puzzle.id}/edit`}
                  >
                    Edit
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-sm font-semibold text-[#d8c8b7]">
              No puzzles yet. Create the first one when you&apos;re ready.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

async function loadPuzzles() {
  try {
    return {
      errorMessage: "",
      puzzles: await getAdminPuzzleList(),
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        errorMessage:
          "Supabase admin config is missing. Add server-only Supabase env vars to create and edit puzzles.",
        puzzles: [],
      };
    }

    console.error(error);

    return {
      errorMessage: "Could not load puzzles right now.",
      puzzles: [],
    };
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e4aa73]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function PuzzleNumberBadge({ puzzle }: { puzzle: Puzzle }) {
  if (puzzle.puzzleNumber === null) {
    return (
      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#d8c8b7]">
        No #
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#211b17]">
      #{puzzle.puzzleNumber}
    </span>
  );
}

function StatusBadge({ status }: { status: PuzzleStatus }) {
  const classNameByStatus: Record<PuzzleStatus, string> = {
    archived: "bg-white/10 text-[#d8c8b7]",
    draft: "bg-[#3a3028] text-[#f3d8bc]",
    published: "bg-[#d9f8c4] text-[#244512]",
    scheduled: "bg-[#d8ecff] text-[#153e63]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${classNameByStatus[status]}`}
    >
      {status}
    </span>
  );
}

function CountingBadge({ puzzle }: { puzzle: Puzzle }) {
  if (puzzle.isTest) {
    return (
      <span className="inline-flex rounded-full border border-[#e4aa73]/40 px-3 py-1 text-xs font-black text-[#e4aa73]">
        Test
      </span>
    );
  }

  if (!puzzle.countsTowardPuzzleNumber) {
    return (
      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#d8c8b7]">
        Not counting
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#fffaf1] px-3 py-1 text-xs font-black text-[#211b17]">
      Counting
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Puzzle["difficulty"] }) {
  return (
    <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-[#d8c8b7]">
      {difficulty ? difficulty.replace("_", " ") : "No difficulty"}
    </span>
  );
}

function getPuzzleSummary(puzzles: Puzzle[]) {
  return puzzles.reduce(
    (summary, puzzle) => ({
      published: summary.published + (puzzle.status === "published" ? 1 : 0),
      scheduled: summary.scheduled + (puzzle.status === "scheduled" ? 1 : 0),
      tests: summary.tests + (puzzle.isTest ? 1 : 0),
    }),
    { published: 0, scheduled: 0, tests: 0 },
  );
}

function getMissingPublicPuzzleDays(puzzles: Puzzle[]) {
  const publicDates = puzzles
    .filter(
      (puzzle) =>
        !puzzle.isTest &&
        (puzzle.status === "scheduled" || puzzle.status === "published"),
    )
    .map((puzzle) => puzzle.date)
    .sort();

  if (publicDates.length < 2) {
    return [];
  }

  const missingDays: string[] = [];
  const dateSet = new Set(publicDates);
  const currentDate = parseDate(publicDates[0]);
  const lastDate = parseDate(publicDates[publicDates.length - 1]);

  while (currentDate < lastDate) {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    const dateKey = formatDateKey(currentDate);

    if (!dateSet.has(dateKey)) {
      missingDays.push(dateKey);
    }
  }

  return missingDays.slice(0, 14);
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
