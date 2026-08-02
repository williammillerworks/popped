import assert from "node:assert/strict";
import test from "node:test";

import {
  formatOrdinal,
  formatRepeatCount,
  getResultBadge,
  getResultPresentation,
} from "../lib/result-presentation.ts";
import {
  getStoredResultHistoryValue,
  parseStoredSession,
  parseStoredResult,
  parseStoredResultHistory,
  saveStoredResult,
} from "../lib/resultPersistence.ts";
function createResult(
  overrides,
) {
  return {
    hasUsedRepeat: false,
    resultLabel: "Clean Guess",
    showSpoiler: true,
    solved: true,
    solvedClipDuration: 1,
    solvedStage: 1,
    totalGuesses: 1,
    totalRepeatsUsed: 0,
    ...overrides,
  };
}

test("Newcomer has priority for the first solved or failed completion", () => {
  const solved = createResult({ puzzleId: "first-solved", puzzleNumber: 1 });
  const failed = createResult({
    puzzleId: "first-failed",
    puzzleNumber: 1,
    solved: false,
    solvedClipDuration: undefined,
    solvedStage: undefined,
  });

  assert.equal(getResultBadge(solved, 0), "newcomer");
  assert.equal(getResultBadge(failed, 0), "newcomer");
});

test("Genius requires a solve and accepts Stage 1 or zero Repeats", () => {
  assert.equal(
    getResultBadge(
      createResult({
        puzzleId: "stage-one",
        puzzleNumber: 2,
        totalRepeatsUsed: 3,
      }),
      1,
    ),
    "genius",
  );
  assert.equal(
    getResultBadge(
      createResult({
        puzzleId: "no-repeat",
        puzzleNumber: 3,
        solvedStage: 6,
      }),
      2,
    ),
    "genius",
  );
  assert.equal(
    getResultBadge(
      createResult({
        puzzleId: "failed",
        puzzleNumber: 4,
        solved: false,
        solvedClipDuration: undefined,
        solvedStage: undefined,
      }),
      3,
    ),
    "default",
  );
});

test("default is used for a returning solve outside Genius conditions", () => {
  const result = createResult({
    puzzleId: "default",
    puzzleNumber: 5,
    solvedStage: 3,
    totalRepeatsUsed: 1,
  });

  assert.equal(getResultBadge(result, 4), "default");
});

test("statistics include failures and use consecutive puzzle numbers", () => {
  const history = [
    createResult({ puzzleId: "one", puzzleNumber: 1 }),
    createResult({
      puzzleId: "two",
      puzzleNumber: 2,
      solved: false,
      solvedClipDuration: undefined,
      solvedStage: undefined,
    }),
    createResult({ puzzleId: "four", puzzleNumber: 4 }),
  ];
  const current = createResult({
    puzzleId: "five",
    puzzleNumber: 5,
    solvedStage: 4,
    totalRepeatsUsed: 2,
  });
  const presentation = getResultPresentation(current, history);

  assert.deepEqual(presentation, {
    badge: "default",
    statistics: {
      completed: 4,
      solvePercentage: 75,
      streak: 2,
    },
  });
});

test("the current result replaces a stored copy instead of double counting", () => {
  const stored = createResult({
    puzzleId: "same",
    puzzleNumber: 7,
    showSpoiler: true,
  });
  const current = { ...stored, showSpoiler: false };
  const presentation = getResultPresentation(current, [stored]);

  assert.equal(presentation.statistics.completed, 1);
  assert.equal(presentation.statistics.streak, 1);
});

test("ordinal and repeat grammar handles singular and teen suffixes", () => {
  assert.equal(formatOrdinal(1), "1st");
  assert.equal(formatOrdinal(2), "2nd");
  assert.equal(formatOrdinal(3), "3rd");
  assert.equal(formatOrdinal(4), "4th");
  assert.equal(formatOrdinal(11), "11th");
  assert.equal(formatOrdinal(12), "12th");
  assert.equal(formatOrdinal(13), "13th");
  assert.equal(formatOrdinal(21), "21st");
  assert.equal(formatRepeatCount(1), "1 repeat");
  assert.equal(formatRepeatCount(0), "0 repeats");
  assert.equal(formatRepeatCount(12), "12 repeats");
});

test("legacy results parse with safe Repeat defaults", () => {
  const legacyValue = JSON.stringify({
    puzzleId: "legacy",
    puzzleNumber: 8,
    resultLabel: "No Repeat",
    solved: true,
    solvedStage: 2,
    totalGuesses: 1,
    totalRepeatsUsed: 0,
  });

  assert.deepEqual(parseStoredResult(legacyValue), {
    hasUsedRepeat: false,
    puzzleId: "legacy",
    puzzleNumber: 8,
    resultLabel: "No Repeat",
    solved: true,
    solvedStage: 2,
    totalGuesses: 1,
    totalRepeatsUsed: 0,
  });
});

test("legacy sessions receive the six-stage classic preset snapshot", () => {
  const legacyValue = JSON.stringify({
    currentStage: 3,
    guesses: ["wrong"],
    puzzleDate: "2026-08-01",
    puzzleId: "legacy-session",
    revealed: false,
    solved: false,
  });
  const session = parseStoredSession(legacyValue);

  assert.equal(session?.durationPresetId, "classic_v1");
  assert.deepEqual(session?.stageDurations, [0.2, 0.4, 0.8, 1.2, 2, 3]);
});

test("stored history enumerates result keys and ignores unrelated storage", () => {
  const localStorage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent() {},
      localStorage,
    },
  });

  const first = createResult({ puzzleId: "alpha", puzzleNumber: 1 });
  const second = createResult({ puzzleId: "beta", puzzleNumber: 2 });
  localStorage.setItem("popped-session-alpha", "not a result");

  assert.equal(saveStoredResult(first), true);
  assert.equal(saveStoredResult(second), true);

  const history = parseStoredResultHistory(getStoredResultHistoryValue());
  assert.deepEqual(
    history.map((result) => result.puzzleId).sort(),
    ["alpha", "beta"],
  );
});

class MemoryStorage {
  values = new Map();

  get length() {
    return this.values.size;
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}
