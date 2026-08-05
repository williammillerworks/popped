# Initial Gameplay Audio Hotfix - Design

> Version: 1.0.0 | Date: 2026-08-05 | Status: Approved
> Level: Dynamic | Plan: `docs/01-plan/features/initial-gameplay-audio-hotfix.plan.md`

## 1. Overview

The existing `PoppedGameSession` remains the single owner of the shared
`HTMLAudioElement`. The hotfix removes overlapping entry priming, restores a
known audible state before real playback, and aligns Continue with its approved
countdown/replay transition.

## 2. Audio State Invariants

- The audio element is normally unmuted; temporary muting is allowed only while
  best-effort priming or buffer acquisition owns the element.
- Only one entry path starts priming for a given interaction.
- Real stage/repeat/reveal playback restores `muted = false` before `play()`.
- A priming completion may not pause or remute a newer real playback attempt.
- `NotAllowedError` means browser autoplay denial. `AbortError` means playback
  was interrupted and is handled as a normal playback failure.

## 3. Transition Design

| Trigger | Priming | Countdown | Playback |
| --- | --- | --- | --- |
| First Play, buffer ready | One mobile priming attempt | `3, 2, 1` | Stage 1 |
| First Play, buffer pending | One persistent muted buffer attempt, then one mobile attempt | `3, 2, 1` | Stage 1 |
| Continue | One mobile priming attempt | `2, 1` | Stored stage |
| Next Clue | One mobile priming attempt | `2, 1` | Next stage |
| Repeat | None | None | Current stage directly from tap |

`requestGameEntryWithTransition` no longer primes before deciding whether the
range is ready. The selected ready/pending branch owns priming, preventing the
current mobile-prime/buffer-prime overlap.

## 4. Component Changes

### `components/game/PoppedGame.tsx`

- Remove the unconditional priming call from the entry wrapper.
- Make Continue set `countdownPlayback`, `countdownValue = 2`, and
  `gameState = "countdown"`, then prime once.
- Restore the audible invariant at the beginning of real playback.
- Keep the existing play-id guard so late priming callbacks cannot pause newer
  playback.

### `lib/audioPlayback.ts`

- Add a small `prepareAudioForAudiblePlayback` helper that restores the audible
  invariant and can be unit tested without React.
- Narrow `isAutoplayBlocked` to `NotAllowedError`.

## 5. API and Data Model

No API, persistence schema, analytics schema, or database changes are required.

## 6. Test Plan

### Automated

- Audible preparation changes a muted media object to unmuted.
- Audible preparation preserves an already unmuted media object.
- `NotAllowedError` is classified as autoplay blocked.
- `AbortError` and ordinary errors are not classified as autoplay blocked.
- Existing lint, TypeScript, unit tests, and production build pass.

### Browser/Device

- Fresh-site first Play: Stage 1 is audible after `3, 2, 1`.
- Next Clue and Repeat remain audible.
- Refresh during a saved game: Continue shows `2, 1` and replays the stage.
- Chrome desktop and iPhone Safari blocked playback show the Repeat recovery
  message and recover from a direct Repeat tap.

## 7. Rollback

The change is isolated to media state and transitions. Reverting the component,
helper, and focused test changes restores the prior behavior without data
migration.
