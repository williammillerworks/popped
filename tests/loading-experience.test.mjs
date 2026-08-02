import assert from "node:assert/strict";
import test from "node:test";

import {
  getDailyLoadingMessage,
  getLoadingCompletionDuration,
  LOADING_MESSAGES_V1,
} from "../lib/loading-experience.ts";

test("loading copy remains stable for the same Seoul calendar date", () => {
  const firstRead = getDailyLoadingMessage("2026-08-01");
  const refreshedRead = getDailyLoadingMessage("2026-08-01");

  assert.equal(firstRead, "Warming up the lightsticks");
  assert.equal(refreshedRead, firstRead);
});

test("loading copy rotates through the versioned list by calendar day", () => {
  const messages = Array.from({ length: LOADING_MESSAGES_V1.length }, (_, day) =>
    getDailyLoadingMessage(`2026-08-0${day + 1}`),
  );

  assert.deepEqual(messages, [...LOADING_MESSAGES_V1]);
  assert.equal(
    getDailyLoadingMessage("2026-08-07"),
    LOADING_MESSAGES_V1[0],
  );
});

test("loading copy selection supports dates before the version epoch", () => {
  assert.equal(
    getDailyLoadingMessage("2026-07-31"),
    LOADING_MESSAGES_V1.at(-1),
  );
});

test("loading copy rejects non-calendar date input", () => {
  assert.throws(
    () => getDailyLoadingMessage("August 1, 2026"),
    /Invalid loading message date/,
  );
});

test("completion duration grows with the remaining visible distance", () => {
  assert.equal(getLoadingCompletionDuration(0), 1100);
  assert.equal(getLoadingCompletionDuration(0.5), 910);
  assert.equal(getLoadingCompletionDuration(1), 720);
});

test("completion duration clamps invalid and out-of-range progress", () => {
  assert.equal(getLoadingCompletionDuration(Number.NaN), 1100);
  assert.equal(getLoadingCompletionDuration(-1), 1100);
  assert.equal(getLoadingCompletionDuration(2), 720);
});
