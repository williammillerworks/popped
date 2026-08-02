import { PageViewTracker } from "../../components/analytics/PageViewTracker";
import { ResolvedArrivalScreen } from "../../components/game/ArrivalScreen";
import { PoppedGame } from "../../components/game/PoppedGame";
import {
  DEFAULT_PUZZLE_TIME_ZONE,
  getHourInTimeZone,
  getPreviousCalendarDate,
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
  const previousDate =
    getHourInTimeZone() < 2 ? getPreviousCalendarDate(today) : null;
  const [todayPuzzle, previousPuzzle] = await Promise.all([
    getTodayPuzzle(today),
    previousDate ? getTodayPuzzle(previousDate) : Promise.resolve(null),
  ]);

  if (todayPuzzle.errorMessage) {
    return (
      <>
        <PageViewTracker hasPuzzle={false} status="error" />
        <ResolvedArrivalScreen
          date={todayPuzzle.date}
          errorMessage="Puzzle load failure"
          variant="error"
        />
      </>
    );
  }

  if (!todayPuzzle.puzzle && !previousPuzzle?.puzzle) {
    return (
      <>
        <PageViewTracker
          hasPuzzle={false}
          status={todayPuzzle.errorMessage ? "error" : "missing"}
        />
        <ResolvedArrivalScreen date={todayPuzzle.date} variant="missing" />
      </>
    );
  }

  return (
    <>
      <PageViewTracker
        hasPuzzle
        puzzleNumber={todayPuzzle.puzzle?.puzzleNumber}
        status="loaded"
      />
      <PoppedGame
        date={todayPuzzle.date}
        previousPuzzle={previousPuzzle?.puzzle ?? null}
        puzzle={todayPuzzle.puzzle}
      />
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
