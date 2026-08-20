import Link from "next/link";

import {
  AdminAlert,
  ADMIN_BUTTON_GHOST,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  AdminIcon,
  AdminPageHeader,
  AdminPanel,
  AdminShell,
} from "../../../../components/admin/admin-ui";
import { requireAdminSession } from "../../../../lib/adminAuth";
import { getAdminPuzzleList } from "../../../../lib/adminPuzzles";
import { SupabaseConfigError } from "../../../../lib/supabase/server";
import type { Puzzle, PuzzleStatus } from "../../../../types/puzzle";
import { signOutAdminAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlesPage() {
  const session = await requireAdminSession();
  const { errorMessage, puzzles } = await loadPuzzles();
  const summary = getPuzzleSummary(puzzles);
  const missingDays = getMissingPublicPuzzleDays(puzzles);

  return (
    <AdminShell
      active="puzzles"
      email={session.email}
      signOutAction={signOutAdminAction}
    >
      <div className="grid gap-6">
        <AdminPageHeader
          action={
            <Link className={ADMIN_BUTTON_PRIMARY} href="/admin/puzzles/new">
              <AdminIcon name="plus" size={17} />
              Create puzzle
            </Link>
          }
          description="Review the publishing pipeline, schedule coverage, and editorial state of every audio puzzle."
          eyebrow="Catalog"
          title="Puzzle schedule"
        />

        {errorMessage ? (
          <AdminAlert title="Puzzles could not be loaded" variant="error">
            {errorMessage}
          </AdminAlert>
        ) : null}

        <section aria-label="Puzzle summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="All puzzles" value={puzzles.length} />
          <SummaryCard label="Published" tone="success" value={summary.published} />
          <SummaryCard label="Scheduled" tone="accent" value={summary.scheduled} />
          <SummaryCard label="Test entries" value={summary.tests} />
        </section>

        {missingDays.length > 0 ? (
          <AdminAlert title={`${missingDays.length} schedule gaps found`} variant="warning">
            <p>
              Public scheduled or published puzzles are missing on these dates
              within the current list range.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {missingDays.map((date) => (
                <time
                  className="rounded-md border border-admin-warning/15 bg-admin-surface/70 px-2 py-1 font-mono text-xs font-semibold tabular-nums"
                  dateTime={date}
                  key={date}
                >
                  {date}
                </time>
              ))}
            </div>
          </AdminAlert>
        ) : null}

        {puzzles.length > 0 ? (
          <AdminPanel className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-admin-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em]">
                  All puzzles
                </h2>
                <p className="mt-0.5 text-sm text-admin-muted">
                  Test puzzles do not count unless explicitly converted.
                </p>
              </div>
              <span className="text-xs font-medium tabular-nums text-admin-subtle">
                {puzzles.length} {puzzles.length === 1 ? "record" : "records"}
              </span>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Puzzles with date, number, song, artist, status, publishing
                  state, difficulty, and edit action
                </caption>
                <thead>
                  <tr className="border-b border-admin-border bg-admin-surface-subtle/60 text-xs font-medium text-admin-muted">
                    <th className="px-5 py-3" scope="col">Date</th>
                    <th className="px-3 py-3 text-center" scope="col">No.</th>
                    <th className="px-3 py-3" scope="col">Song</th>
                    <th className="px-3 py-3" scope="col">Artist</th>
                    <th className="px-3 py-3" scope="col">Status</th>
                    <th className="px-3 py-3" scope="col">State</th>
                    <th className="px-3 py-3" scope="col">Difficulty</th>
                    <th className="px-5 py-3 text-end" scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {puzzles.map((puzzle) => (
                    <tr
                      className="group transition-colors duration-150 hover:bg-admin-surface-subtle/50"
                      key={puzzle.id}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs tabular-nums text-admin-muted">
                        <time dateTime={puzzle.date}>{puzzle.date}</time>
                      </td>
                      <td className="px-3 py-3.5 text-center tabular-nums">
                        <PuzzleNumberBadge puzzle={puzzle} />
                      </td>
                      <td className="max-w-56 px-3 py-3.5">
                        <p
                          className="truncate font-medium text-admin-text"
                          title={puzzle.songTitleEnglish}
                        >
                          {puzzle.songTitleEnglish}
                        </p>
                      </td>
                      <td className="max-w-44 px-3 py-3.5">
                        <p className="truncate text-admin-muted" title={puzzle.artistName}>
                          {puzzle.artistName}
                        </p>
                      </td>
                      <td className="px-3 py-3.5"><StatusBadge status={puzzle.status} /></td>
                      <td className="px-3 py-3.5"><CountingBadge puzzle={puzzle} /></td>
                      <td className="px-3 py-3.5"><DifficultyBadge difficulty={puzzle.difficulty} /></td>
                      <td className="px-5 py-3.5 text-end">
                        <Link
                          aria-label={`Edit ${puzzle.songTitleEnglish}`}
                          className={ADMIN_BUTTON_GHOST}
                          href={`/admin/puzzles/${puzzle.id}/edit`}
                        >
                          Edit
                          <AdminIcon name="chevron-right" size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-border md:hidden">
              {puzzles.map((puzzle) => (
                <article className="grid gap-4 p-4" key={puzzle.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold" title={puzzle.songTitleEnglish}>
                        {puzzle.songTitleEnglish}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-admin-muted" title={puzzle.artistName}>
                        {puzzle.artistName}
                      </p>
                    </div>
                    <StatusBadge status={puzzle.status} />
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-admin-surface-subtle/70 p-3 text-sm">
                    <MobileMeta label="Date">
                      <time className="font-mono text-xs tabular-nums" dateTime={puzzle.date}>
                        {puzzle.date}
                      </time>
                    </MobileMeta>
                    <MobileMeta label="Puzzle number"><PuzzleNumberBadge puzzle={puzzle} /></MobileMeta>
                    <MobileMeta label="Publishing state"><CountingBadge puzzle={puzzle} /></MobileMeta>
                    <MobileMeta label="Difficulty"><DifficultyBadge difficulty={puzzle.difficulty} /></MobileMeta>
                  </dl>

                  <Link
                    className={`${ADMIN_BUTTON_SECONDARY} w-full`}
                    href={`/admin/puzzles/${puzzle.id}/edit`}
                  >
                    Edit puzzle
                    <AdminIcon name="chevron-right" size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </AdminPanel>
        ) : (
          <AdminPanel className="px-5 py-14 text-center sm:px-8">
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-admin-accent-soft text-admin-accent">
              <AdminIcon name="music" size={20} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No puzzles yet</h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-pretty text-sm leading-6 text-admin-muted">
              Create the first draft to start the schedule. New puzzles begin as
              test entries and do not affect public numbering.
            </p>
            <Link className={`${ADMIN_BUTTON_PRIMARY} mt-5`} href="/admin/puzzles/new">
              <AdminIcon name="plus" size={17} />
              Create the first puzzle
            </Link>
          </AdminPanel>
        )}
      </div>
    </AdminShell>
  );
}

function MobileMeta({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-admin-subtle">{label}</dt>
      <dd className="mt-1 text-admin-text">{children}</dd>
    </div>
  );
}

async function loadPuzzles() {
  try {
    return { errorMessage: "", puzzles: await getAdminPuzzleList() };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        errorMessage:
          "Supabase admin config is missing. Add server-only Supabase environment variables to create and edit puzzles.",
        puzzles: [],
      };
    }

    console.error(error);
    return {
      errorMessage:
        "The puzzle catalog is unavailable right now. Check the database connection, then refresh.",
      puzzles: [],
    };
  }
}

function SummaryCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "accent" | "neutral" | "success";
  value: number;
}) {
  const toneClass = {
    accent: "bg-admin-accent-soft text-admin-accent",
    neutral: "bg-admin-surface-subtle text-admin-muted",
    success: "bg-admin-success-soft text-admin-success",
  }[tone];

  return (
    <AdminPanel className="p-4 sm:p-5">
      <div className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${toneClass}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] tabular-nums">
        {value}
      </p>
    </AdminPanel>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function PuzzleNumberBadge({ puzzle }: { puzzle: Puzzle }) {
  if (puzzle.puzzleNumber === null) {
    return <Badge className="bg-admin-surface-subtle text-admin-subtle">—</Badge>;
  }

  return (
    <Badge className="bg-admin-surface-subtle text-admin-text">
      <span className="tabular-nums">#{puzzle.puzzleNumber}</span>
    </Badge>
  );
}

function StatusBadge({ status }: { status: PuzzleStatus }) {
  const classNameByStatus: Record<PuzzleStatus, string> = {
    archived: "bg-admin-surface-subtle text-admin-muted",
    draft: "bg-admin-warning-soft text-admin-warning",
    published: "bg-admin-success-soft text-admin-success",
    scheduled: "bg-admin-accent-soft text-admin-accent",
  };

  return (
    <Badge className={classNameByStatus[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}

function CountingBadge({ puzzle }: { puzzle: Puzzle }) {
  if (puzzle.isTest) {
    return <Badge className="bg-admin-warning-soft text-admin-warning">Test</Badge>;
  }

  if (!puzzle.countsTowardPuzzleNumber) {
    return <Badge className="bg-admin-surface-subtle text-admin-muted">Not counting</Badge>;
  }

  return <Badge className="bg-admin-success-soft text-admin-success">Counting</Badge>;
}

function DifficultyBadge({ difficulty }: { difficulty: Puzzle["difficulty"] }) {
  return (
    <Badge className="bg-admin-surface-subtle text-admin-muted">
      {difficulty ? difficulty.replace("_", " ") : "Not set"}
    </Badge>
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
