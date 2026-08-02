# result-redesign - Design

> Version: 1.0.0 | Date: 2026-07-22 | Status: Approved
> Level: Dynamic | Plan: `docs/01-plan/features/result-redesign.plan.md`

## 1. Architecture

`PoppedGameSession` remains the owner of puzzle routing, result completion,
audio playback, and persistence. A scoped `ResultScreen` renders only the
Result category. Pure presentation helpers classify the badge and aggregate
browser-local statistics from stored per-puzzle results.

No API, database, admin, Arrival, Gameplay, scoring, or answer-matching change
is required.

## 2. Components

### PoppedGameSession

- Creates results with puzzle date, completion timestamp, and visible spoiler state.
- Reads all valid locally stored results through the existing storage subscription.
- Restores spoiler visibility only when the player opens a stored result.
- Keeps first-completion autoplay and suppresses autoplay on stored-result revisit.
- Pauses/resumes reveal audio from the Result player.
- Tracks whether Result was opened directly after completion, from ARR-04, or
  from the completed Gameplay screen.
- Returns Result to the matching origin without clearing completion or enabling
  replay.

### ResultScreen

- Renders the approved back control, badge, copy, aggregate statistics, song
  player, icon Share action, and Archive placeholder.
- Uses the same shown/hidden song player for every badge variant.
- Uses a CSS icon for close, play, and pause controls with accessible labels.
- Keeps audio and persistence guidance inside the Result category.
- Shows short `Copied`, `Shared`, `Try Again`, and `Coming soon` toasts below
  the back control without locking the rest of the Result controls.

### Result presentation helpers

- Merge the current result into unique local history by puzzle ID.
- Classify Newcomer, Genius, or default without changing `resultLabel`.
- Calculate Completed, Solve %, and consecutive-puzzle Streak.
- Format stage ordinals and repeat-count grammar.

## 3. Data Model

`GameResult` gains optional backward-compatible fields:

- `puzzleDate`: published puzzle date used by the hidden player.
- `completedAt`: local completion timestamp.
- `showSpoiler`: persisted shown/hidden state.

The canonical result remains stored at `popped-result-{puzzleId}`. History is
read by enumerating those existing keys; no second ledger or remote write is
introduced. Legacy results without optional fields remain valid and count
toward Completed, Solve %, Newcomer history, and puzzle-number Streak.

## 4. Presentation Rules

| Priority | Variant | Condition |
| --- | --- | --- |
| 1 | Newcomer | No different locally completed puzzle exists |
| 2 | Genius | Solved and Stage 1 or zero Repeats |
| 3 | Congratulations | Other solved result |
| 3 | Not Today | Returning-player failed result |

Newcomer applies to both solved and failed first completions. Existing
`resultLabel` values continue to drive share text and analytics.

## 5. Statistics

- Completed: unique finalized puzzle results, including Reveal failures.
- Solve %: solved / completed, rounded to the nearest whole percent.
- Streak: consecutive completed puzzle numbers ending at the current result.
- The current in-memory result is merged so statistics still render when local
  storage is unavailable.
- Revisit and Show/Hide updates overwrite the same puzzle result and never
  increment statistics.

## 6. Song Player

- Direct completion opens shown and keeps the existing autoplay attempt.
- Stored-result revisit restores `showSpoiler` and does not autoplay.
- Hide pauses playing audio and persists `false`.
- Show persists `true` without starting audio.
- Pause preserves current preview position; Play resumes from that position.
- Finished/error/blocked playback starts again from the preview timestamp.
- Hidden mode shows `Artist Hidden` and the formatted puzzle date.
- Missing album art uses the iridescent placeholder in both modes.

## 7. Navigation

- Direct completion Back opens the read-only completed Gameplay screen.
- ARR-04 Show Result Back returns to ARR-04.
- Completed Gameplay See result Back returns to completed Gameplay.
- Refreshing or revisiting still lands on ARR-04 through the stored result.
- Result Back pauses preview playback. Result reopened from ARR-04 or completed
  Gameplay does not autoplay.
- The Archive action remains visually active for the launch layout and shows
  `Coming soon`; it does not navigate.
- The stored result and completion state remain intact, so replay is impossible.

## 8. Verification

- Pure helper tests for precedence, first-failure Newcomer, Genius OR logic,
  aggregate counts, solve percentage, streak gaps, and grammar.
- Persistence tests for legacy result parsing, optional fields, history
  enumeration, and visibility updates.
- Browser verification for direct completion, revisit, Back/Show Result,
  Show/Hide, Play/Pause, and mobile/desktop layout.
- Run TypeScript, ESLint, focused tests, and production build.
