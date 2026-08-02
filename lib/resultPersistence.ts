import type {
  ActiveGameSession,
  GameResult,
  GameSession,
} from "../types/game";
import {
  DEFAULT_DURATION_PRESET_ID,
  STAGE_DURATIONS_SECONDS,
  TOTAL_STAGES,
  isDurationPresetId,
} from "../config/game";

const RESULT_STORAGE_EVENT = "popped-result-storage";
const RESULT_STORAGE_PREFIX = "popped-result-";
const ACTIVE_SESSION_STORAGE_KEY = "popped-active-session";

type StoredGameResult = Omit<GameResult, "hasUsedRepeat"> & {
  hasUsedRepeat?: boolean;
};

type StoredGameSession = Omit<
  GameSession,
  | "durationPresetId"
  | "hasUsedRepeat"
  | "stageDurations"
  | "totalRepeatsUsed"
> & {
  durationPresetId?: GameSession["durationPresetId"];
  hasUsedRepeat?: boolean;
  repeatsUsedByStage?: Record<string, boolean>;
  stageDurations?: number[];
  totalRepeatsUsed?: number;
};

export function getResultStorageKey(puzzleId: string): string {
  return `${RESULT_STORAGE_PREFIX}${puzzleId}`;
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

export function getStoredResultHistoryValue(): string {
  try {
    const storedValues: Array<[string, string]> = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key?.startsWith(RESULT_STORAGE_PREFIX)) {
        continue;
      }

      const value = window.localStorage.getItem(key);
      if (value) {
        storedValues.push([key, value]);
      }
    }

    storedValues.sort(([leftKey], [rightKey]) =>
      leftKey.localeCompare(rightKey),
    );

    return JSON.stringify(storedValues.map(([, value]) => value));
  } catch {
    return "[]";
  }
}

export function getStoredSessionValue(puzzleId: string): string | null {
  try {
    return window.localStorage.getItem(getSessionStorageKey(puzzleId));
  } catch {
    return null;
  }
}

export function getActiveStoredSessionValue(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
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
    if (!isGameResult(parsedValue)) {
      return null;
    }

    return {
      ...parsedValue,
      hasUsedRepeat:
        parsedValue.hasUsedRepeat ?? parsedValue.totalRepeatsUsed > 0,
    };
  } catch {
    return null;
  }
}

export function parseStoredResultHistory(storedValue: string): GameResult[] {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap((value) => {
      if (typeof value !== "string") {
        return [];
      }

      const result = parseStoredResult(value);
      return result ? [result] : [];
    });
  } catch {
    return [];
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
    if (!isGameSession(parsedValue)) {
      return null;
    }

    const legacyRepeatCount = Object.values(
      parsedValue.repeatsUsedByStage ?? {},
    ).filter(Boolean).length;
    const totalRepeatsUsed =
      parsedValue.totalRepeatsUsed ?? legacyRepeatCount;

    return {
      completedAt: parsedValue.completedAt,
      currentStage: parsedValue.currentStage,
      durationPresetId:
        parsedValue.durationPresetId ?? DEFAULT_DURATION_PRESET_ID,
      guesses: parsedValue.guesses,
      hasUsedRepeat: parsedValue.hasUsedRepeat ?? totalRepeatsUsed > 0,
      puzzleDate: parsedValue.puzzleDate,
      puzzleId: parsedValue.puzzleId,
      revealed: parsedValue.revealed,
      solved: parsedValue.solved,
      solvedStage: parsedValue.solvedStage,
      stageDurations: parsedValue.stageDurations ?? [
        ...STAGE_DURATIONS_SECONDS,
      ],
      startedAt: parsedValue.startedAt,
      totalRepeatsUsed,
    };
  } catch {
    return null;
  }
}

export function parseActiveStoredSession(
  storedValue: string | null,
): ActiveGameSession | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return isActiveGameSession(parsedValue) ? parsedValue : null;
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
    window.localStorage.setItem(
      ACTIVE_SESSION_STORAGE_KEY,
      JSON.stringify({
        puzzleDate: session.puzzleDate,
        puzzleId: session.puzzleId,
        updatedAt: new Date().toISOString(),
      } satisfies ActiveGameSession),
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
    const activeSession = parseActiveStoredSession(
      window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY),
    );

    if (activeSession?.puzzleId === puzzleId) {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
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

function isGameResult(value: unknown): value is StoredGameResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Partial<StoredGameResult>;

  return (
    typeof result.puzzleId === "string" &&
    typeof result.puzzleNumber === "number" &&
    (result.puzzleDate === undefined || isPuzzleDate(result.puzzleDate)) &&
    (result.completedAt === undefined ||
      typeof result.completedAt === "string") &&
    typeof result.solved === "boolean" &&
    typeof result.totalGuesses === "number" &&
    typeof result.totalRepeatsUsed === "number" &&
    (result.hasUsedRepeat === undefined ||
      typeof result.hasUsedRepeat === "boolean") &&
    typeof result.resultLabel === "string" &&
    (result.showSpoiler === undefined ||
      typeof result.showSpoiler === "boolean") &&
    (result.solvedStage === undefined ||
      typeof result.solvedStage === "number") &&
    (result.solvedClipDuration === undefined ||
      typeof result.solvedClipDuration === "number")
  );
}

function isGameSession(value: unknown): value is StoredGameSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<StoredGameSession>;

  return (
    typeof session.puzzleId === "string" &&
    isPuzzleDate(session.puzzleDate) &&
    isStageNumber(session.currentStage) &&
    Array.isArray(session.guesses) &&
    session.guesses.every((guess) => typeof guess === "string") &&
    (session.totalRepeatsUsed === undefined ||
      isNonNegativeInteger(session.totalRepeatsUsed)) &&
    (session.hasUsedRepeat === undefined ||
      typeof session.hasUsedRepeat === "boolean") &&
    (session.repeatsUsedByStage === undefined ||
      isRepeatUsage(session.repeatsUsedByStage)) &&
    typeof session.solved === "boolean" &&
    typeof session.revealed === "boolean" &&
    (session.startedAt === undefined || typeof session.startedAt === "string") &&
    (session.completedAt === undefined ||
      typeof session.completedAt === "string") &&
    (session.durationPresetId === undefined ||
      isDurationPresetId(session.durationPresetId)) &&
    (session.stageDurations === undefined ||
      isStageDurations(session.stageDurations)) &&
    (session.solvedStage === undefined || isStageNumber(session.solvedStage))
  );
}

function isActiveGameSession(value: unknown): value is ActiveGameSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<ActiveGameSession>;

  return (
    typeof session.puzzleId === "string" &&
    isPuzzleDate(session.puzzleDate) &&
    typeof session.updatedAt === "string"
  );
}

function isPuzzleDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isStageNumber(value: unknown): value is GameSession["currentStage"] {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= TOTAL_STAGES
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isRepeatUsage(value: unknown): value is Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).every(
    ([stage, used]) =>
      Number.isInteger(Number(stage)) &&
      Number(stage) >= 1 &&
      Number(stage) <= TOTAL_STAGES &&
      typeof used === "boolean",
  );
}

function isStageDurations(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === TOTAL_STAGES &&
    value.every(
      (duration, index) =>
        typeof duration === "number" &&
        Number.isFinite(duration) &&
        duration > 0 &&
        (index === 0 || duration > value[index - 1]),
    )
  );
}
