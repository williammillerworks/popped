import type { GameResult } from "../types/game";

const RESULT_STORAGE_EVENT = "popped-result-storage";

export function getResultStorageKey(puzzleId: string): string {
  return `popped-result-${puzzleId}`;
}

export function getStoredResultValue(puzzleId: string): string | null {
  try {
    return window.localStorage.getItem(getResultStorageKey(puzzleId));
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
