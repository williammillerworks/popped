# local-player-profile - Plan Document

> Version: 1.0.0 | Date: 2026-08-04 | Status: Approved
> Level: Dynamic

## 1. Overview

Persist a small anonymous player profile in localStorage so Popped can remember
returning visitors and future onboarding choices before account-based storage is
introduced.

## 2. Goals

- Create one stable anonymous player ID per browser profile.
- Record profile creation and last-seen timestamps.
- Persist onboarding completion and skip as distinct decisions.
- Do not automatically show onboarding after either decision.
- Keep puzzle progress and results in their existing stores.

## 3. Scope

### In Scope

- A versioned `popped-player-profile-v1` localStorage record.
- Defensive parsing, creation, visit updates, and onboarding mutation helpers.
- App-start initialization after client hydration.
- Unit coverage for valid, corrupt, legacy/unknown, and blocked storage cases.

### Out of Scope

- Onboarding UI or the future header entry point.
- Authentication, remote synchronization, or cross-device identity.
- Duplicating Completed, Solve %, Streak, sessions, or results in the profile.

## 4. Success Criteria

- A returning browser keeps the same anonymous player ID.
- Each visit updates `lastSeenAt` without changing `createdAt`.
- Complete and Skip remain distinguishable and suppress automatic onboarding.
- Storage failures never block gameplay.
- Existing gameplay, result, and arrival tests continue to pass.

## 5. Risks

| Risk | Mitigation |
|------|------------|
| Corrupt or manually edited data | Strict parser; replace invalid records safely |
| localStorage is blocked | Return `null`/`false`; gameplay remains available |
| Future schema changes | Explicit `schemaVersion` and versioned key |
| Duplicate sources of truth | Continue deriving aggregate statistics from GameResult history |
