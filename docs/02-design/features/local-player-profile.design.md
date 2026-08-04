# local-player-profile - Design Document

> Version: 1.0.0 | Date: 2026-08-04 | Status: Approved
> Level: Dynamic | Plan: docs/01-plan/features/local-player-profile.plan.md

## 1. Architecture

`LocalPlayerProfile` is a browser-local user record separate from the existing
per-puzzle `GameSession` and `GameResult` records. `PoppedGame` initializes or
touches it once after hydration. No current screen depends on the profile, so
profile failure cannot delay arrival loading or gameplay.

## 2. Data Model

```ts
type LocalPlayerProfile = {
  schemaVersion: 1;
  anonymousPlayerId: string;
  createdAt: string;
  lastSeenAt: string;
  onboarding: {
    completedVersion: number | null;
    completedAt?: string;
    skippedAt?: string;
  };
};
```

Storage key: `popped-player-profile-v1`.

The profile does not contain sessions, results, Completed, Solve %, or Streak.
Those values continue to use their existing canonical records and derivations.

## 3. Persistence API

- `getStoredPlayerProfileValue()` reads safely.
- `parseStoredPlayerProfile()` strictly validates schema v1.
- `initializeLocalPlayerProfile()` creates a profile or updates `lastSeenAt`.
- `recordOnboardingCompleted(version)` records completion without clearing an
  earlier skip timestamp.
- `recordOnboardingSkipped()` records skip without clearing an earlier
  completion timestamp.
- `shouldAutoShowOnboarding(profile)` is true only if neither action exists.
- `subscribeToStoredPlayerProfileChanges()` supports future reactive UI and
  cross-tab updates.

All mutations return `null` or `false` when localStorage is unavailable. IDs use
`crypto.randomUUID()` when available, with a `getRandomValues()` fallback.

## 4. App Integration

After client hydration, `PoppedGame` calls profile initialization in an effect.
The result is not rendered and does not affect the arrival loading gate. React
SSR output therefore remains deterministic.

## 5. Onboarding Rules

- Complete and Skip are distinct persisted actions.
- Either action suppresses future automatic onboarding.
- A future manual header entry can open onboarding without mutating this record.
- Completing onboarding after a prior skip may add completion metadata while
  preserving the historical skip decision.

## 6. Test Plan

- Create a valid profile and retain its ID/createdAt on return.
- Parse valid data and reject corrupt, incomplete, and unknown schemas.
- Record Complete and Skip independently.
- Confirm either action suppresses automatic display.
- Confirm blocked localStorage does not throw.
- Run existing tests, lint, type check, and production build.

## 7. Security and Migration

The anonymous ID is not authentication and must never authorize rewards or
server data. On future login, remote data becomes authoritative and local
results can be idempotently uploaded by `(userId, puzzleId)`.
