import { PageViewTracker } from "../../components/analytics/PageViewTracker";
import { PoppedGame } from "../../components/game/PoppedGame";
import {
  DEFAULT_PUZZLE_TIME_ZONE,
  getTodayDateInTimeZone,
} from "../../lib/dates";
import { getTodayPuzzleApiResponse } from "../../lib/puzzles";
import type { TodayPuzzleApiResponse } from "../../lib/puzzles";

export const dynamic = "force-dynamic";

type HomePuzzleState = TodayPuzzleApiResponse & {
  errorMessage?: string;
};

export default async function Home() {
  const today = getTodayDateInTimeZone();
  const todayPuzzle = await getTodayPuzzle(today);

  if (!todayPuzzle.puzzle) {
    return (
      <>
        <PageViewTracker
          hasPuzzle={false}
          status={todayPuzzle.errorMessage ? "error" : "missing"}
        />
        <main className="min-h-dvh bg-[radial-gradient(circle_at_50%_0%,#ffe7c7_0,#f7f1e8_34rem)] px-3 py-3 text-[#201813] sm:px-6 sm:py-6">
          <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col justify-between gap-8 rounded-[2rem] border border-[#201813]/10 bg-[#fffaf1]/95 p-4 shadow-[0_20px_70px_rgba(32,24,19,0.12)] backdrop-blur sm:min-h-[calc(100dvh-3rem)] sm:p-6">
            <div className="flex items-center justify-between rounded-full bg-white/60 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#8a5f3b]">
              <span>Daily K-pop</span>
              <span className="font-mono tabular-nums">{todayPuzzle.date}</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-4 pt-2">
                <p className="font-mono text-xs font-black uppercase tracking-[0.35em] text-[#b05f3c]">
                  POPPED
                </p>
                <h1 className="text-6xl font-black leading-[0.92] tracking-[-0.08em]">
                  Warming up.
                </h1>
                <p className="max-w-xs text-xl font-semibold leading-8 text-[#5f5148]">
                  Today&apos;s POPPED is still getting cued. Come back soon.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[#201813]/10 bg-white/70 p-5 shadow-inner shadow-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a5f3b]">
                  {todayPuzzle.errorMessage ? "Status" : "Timezone"}
                </p>
                <p className="mt-3 text-base font-semibold leading-7 text-[#5f5148]">
                  {todayPuzzle.errorMessage ??
                    `Daily puzzles use ${todayPuzzle.timezone}.`}
                </p>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <PageViewTracker
        hasPuzzle
        puzzleNumber={todayPuzzle.puzzle.puzzleNumber}
        status="loaded"
      />
      <PoppedGame puzzle={todayPuzzle.puzzle} />
    </>
  );
}

async function getTodayPuzzle(date: string): Promise<HomePuzzleState> {
  try {
    return await getTodayPuzzleApiResponse(date);
  } catch (error) {
    console.error(error);

    return {
      date,
      errorMessage:
        "We could not reach today’s puzzle data. Please refresh in a moment.",
      puzzle: null,
      stageDurations: [],
      timezone: DEFAULT_PUZZLE_TIME_ZONE,
    };
  }
}
