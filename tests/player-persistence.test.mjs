import assert from "node:assert/strict";
import test from "node:test";

import {
  PLAYER_PROFILE_STORAGE_KEY,
  getStoredPlayerProfileValue,
  initializeLocalPlayerProfile,
  parseStoredPlayerProfile,
  recordOnboardingCompleted,
  recordOnboardingSkipped,
  shouldAutoShowOnboarding,
} from "../lib/player-persistence.ts";

test("initialization creates a versioned profile and preserves its identity", () => {
  const localStorage = installMemoryWindow();
  const firstVisit = initializeLocalPlayerProfile(
    new Date("2026-08-04T01:00:00.000Z"),
  );
  const returnVisit = initializeLocalPlayerProfile(
    new Date("2026-08-05T02:30:00.000Z"),
  );

  assert.ok(firstVisit);
  assert.ok(returnVisit);
  assert.equal(firstVisit.schemaVersion, 1);
  assert.equal(firstVisit.createdAt, "2026-08-04T01:00:00.000Z");
  assert.equal(firstVisit.lastSeenAt, "2026-08-04T01:00:00.000Z");
  assert.equal(returnVisit.anonymousPlayerId, firstVisit.anonymousPlayerId);
  assert.equal(returnVisit.createdAt, firstVisit.createdAt);
  assert.equal(returnVisit.lastSeenAt, "2026-08-05T02:30:00.000Z");
  assert.equal(
    localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY),
    JSON.stringify(returnVisit),
  );
});

test("the parser rejects corrupt, incomplete, and unknown profile schemas", () => {
  assert.equal(parseStoredPlayerProfile("not json"), null);
  assert.equal(
    parseStoredPlayerProfile(
      JSON.stringify({
        schemaVersion: 2,
        anonymousPlayerId: "future",
        createdAt: "2026-08-04T01:00:00.000Z",
        lastSeenAt: "2026-08-04T01:00:00.000Z",
        onboarding: { completedVersion: null },
      }),
    ),
    null,
  );
  assert.equal(
    parseStoredPlayerProfile(
      JSON.stringify({
        schemaVersion: 1,
        anonymousPlayerId: "incomplete",
        createdAt: "2026-08-04T01:00:00.000Z",
        lastSeenAt: "not-a-date",
        onboarding: { completedVersion: null },
      }),
    ),
    null,
  );
});

test("completed and skipped onboarding decisions remain distinguishable", () => {
  installMemoryWindow();
  const skippedProfile = recordOnboardingSkipped(
    new Date("2026-08-04T03:00:00.000Z"),
  );
  const completedProfile = recordOnboardingCompleted(
    1,
    new Date("2026-08-04T04:00:00.000Z"),
  );

  assert.ok(skippedProfile);
  assert.equal(skippedProfile.onboarding.skippedAt, "2026-08-04T03:00:00.000Z");
  assert.equal(skippedProfile.onboarding.completedVersion, null);
  assert.ok(completedProfile);
  assert.equal(completedProfile.onboarding.completedVersion, 1);
  assert.equal(
    completedProfile.onboarding.completedAt,
    "2026-08-04T04:00:00.000Z",
  );
  assert.equal(
    completedProfile.onboarding.skippedAt,
    "2026-08-04T03:00:00.000Z",
  );
  assert.equal(
    completedProfile.anonymousPlayerId,
    skippedProfile.anonymousPlayerId,
  );
});

test("either onboarding decision suppresses automatic onboarding", () => {
  installMemoryWindow();
  const untouchedProfile = initializeLocalPlayerProfile(
    new Date("2026-08-04T01:00:00.000Z"),
  );
  const skippedProfile = recordOnboardingSkipped(
    new Date("2026-08-04T02:00:00.000Z"),
  );
  const completedProfile = recordOnboardingCompleted(
    1,
    new Date("2026-08-04T03:00:00.000Z"),
  );

  assert.equal(shouldAutoShowOnboarding(null), true);
  assert.equal(shouldAutoShowOnboarding(untouchedProfile), true);
  assert.equal(shouldAutoShowOnboarding(skippedProfile), false);
  assert.equal(shouldAutoShowOnboarding(completedProfile), false);
});

test("blocked localStorage does not throw or create a partial profile", () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent() {},
      localStorage: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
      },
    },
  });

  assert.equal(getStoredPlayerProfileValue(), null);
  assert.equal(initializeLocalPlayerProfile(), null);
  assert.equal(recordOnboardingSkipped(), null);
});

function installMemoryWindow() {
  const localStorage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      addEventListener() {},
      dispatchEvent() {},
      localStorage,
      removeEventListener() {},
    },
  });
  return localStorage;
}

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
