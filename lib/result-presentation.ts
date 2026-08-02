import type { GameResult } from "../types/game";

export type ResultBadgeVariant = "default" | "genius" | "newcomer";

export type ResultStatistics = {
  completed: number;
  solvePercentage: number;
  streak: number;
};

export type ResultPresentation = {
  badge: ResultBadgeVariant;
  statistics: ResultStatistics;
};

export function getResultPresentation(
  currentResult: GameResult,
  storedResults: GameResult[],
): ResultPresentation {
  const history = mergeResultHistory(currentResult, storedResults);
  const previousResults = history.filter(
    (result) => result.puzzleId !== currentResult.puzzleId,
  );

  return {
    badge: getResultBadge(currentResult, previousResults.length),
    statistics: {
      completed: history.length,
      solvePercentage: getSolvePercentage(history),
      streak: getCompletionStreak(currentResult, history),
    },
  };
}

export function getResultBadge(
  currentResult: GameResult,
  previousCompletionCount: number,
): ResultBadgeVariant {
  if (previousCompletionCount === 0) {
    return "newcomer";
  }

  if (
    currentResult.solved &&
    (currentResult.solvedStage === 1 || currentResult.totalRepeatsUsed === 0)
  ) {
    return "genius";
  }

  return "default";
}

export function getCompletionStreak(
  currentResult: GameResult,
  history: GameResult[],
): number {
  if (!Number.isInteger(currentResult.puzzleNumber)) {
    return 0;
  }

  const completedPuzzleNumbers = new Set(
    history
      .map((result) => result.puzzleNumber)
      .filter((puzzleNumber) => Number.isInteger(puzzleNumber)),
  );
  let streak = 0;
  let puzzleNumber = currentResult.puzzleNumber;

  while (completedPuzzleNumbers.has(puzzleNumber)) {
    streak += 1;
    puzzleNumber -= 1;
  }

  return streak;
}

export function formatOrdinal(value: number): string {
  const lastTwoDigits = Math.abs(value) % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${value}th`;
  }

  switch (Math.abs(value) % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function formatRepeatCount(value: number): string {
  return `${value} ${value === 1 ? "repeat" : "repeats"}`;
}

function mergeResultHistory(
  currentResult: GameResult,
  storedResults: GameResult[],
): GameResult[] {
  const resultByPuzzle = new Map(
    storedResults.map((result) => [result.puzzleId, result]),
  );
  resultByPuzzle.set(currentResult.puzzleId, currentResult);

  return [...resultByPuzzle.values()];
}

function getSolvePercentage(history: GameResult[]): number {
  if (history.length === 0) {
    return 0;
  }

  const solvedCount = history.filter((result) => result.solved).length;
  return Math.round((solvedCount / history.length) * 100);
}
