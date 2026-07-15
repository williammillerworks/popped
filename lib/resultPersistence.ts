import type { GameResult, GameSession } from "../types/game";

const RESULT_STORAGE_EVENT = "popped-result-storage";

export function getResultStorageKey(puzzleId: string): string {
  return `popped-result-${puzzleId}`;
}

export function getSessionStorageKey(puzzleId: string): string {
  return `popped-session-${puzzleId}`;
}

export function getStoredResultValue(puzzleId: string): string | null {
  try {
    return window.localStorage.getItem(getResultStorageKey(puzzleId));
  } catch {
    return null;
  }
}

export function getStoredSessionValue(puzzleId: string): string | null {
  try {
    return window.localStorage.getItem(getSessionStorageKey(puzzleId));
  } catch {
    return null;
  }
}

export function parseStoredResult(storedValue: string | null): GameResult | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return isGameResult(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function parseStoredSession(
  storedValue: string | null,
): GameSession | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return isGameSession(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function saveStoredResult(result: GameResult): boolean {
  try {
    window.localStorage.setItem(
      getResultStorageKey(result.puzzleId),
      JSON.stringify(result),
    );
    window.dispatchEvent(new Event(RESULT_STORAGE_EVENT));
    return true;
  } catch {
    // localStorage persistence is helpful, not required for play.
    return false;
  }
}

export function saveStoredSession(session: GameSession): boolean {
  try {
    window.localStorage.setItem(
      getSessionStorageKey(session.puzzleId),
      JSON.stringify(session),
    );
    window.dispatchEvent(new Event(RESULT_STORAGE_EVENT));
    return true;
  } catch {
    // localStorage persistence is helpful, not required for play.
    return false;
  }
}

export function clearStoredSession(puzzleId: string): boolean {
  try {
    window.localStorage.removeItem(getSessionStorageKey(puzzleId));
    window.dispatchEvent(new Event(RESULT_STORAGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToStoredResultChanges(
  onStoreChange: () => void,
): () => void {
  try {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(RESULT_STORAGE_EVENT, onStoreChange);

    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(RESULT_STORAGE_EVENT, onStoreChange);
    };
  } catch {
    return () => {};
  }
}

function isGameResult(value: unknown): value is GameResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Partial<GameResult>;

  return (
    typeof result.puzzleId === "string" &&
    typeof result.puzzleNumber === "number" &&
    typeof result.solved === "boolean" &&
    typeof result.totalGuesses === "number" &&
    typeof result.totalRepeatsUsed === "number" &&
    typeof result.resultLabel === "string" &&
    (result.solvedStage === undefined ||
      typeof result.solvedStage === "number") &&
    (result.solvedClipDuration === undefined ||
      typeof result.solvedClipDuration === "number")
  );
}

function isGameSession(value: unknown): value is GameSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<GameSession>;

  return (
    typeof session.puzzleId === "string" &&
    isStageNumber(session.currentStage) &&
    Array.isArray(session.guesses) &&
    session.guesses.every((guess) => typeof guess === "string") &&
    isRepeatUsage(session.repeatsUsedByStage) &&
    typeof session.solved === "boolean" &&
    typeof session.revealed === "boolean" &&
    (session.startedAt === undefined || typeof session.startedAt === "string") &&
    (session.completedAt === undefined ||
      typeof session.completedAt === "string") &&
    (session.solvedStage === undefined || isStageNumber(session.solvedStage))
  );
}

function isStageNumber(value: unknown): value is GameSession["currentStage"] {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

function isRepeatUsage(
  value: unknown,
): value is GameSession["repeatsUsedByStage"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).every(
    ([stage, used]) =>
      Number.isInteger(Number(stage)) &&
      Number(stage) >= 1 &&
      Number(stage) <= 7 &&
      typeof used === "boolean",
  );
}
