# gameplay-redesign - Design

> Version: 1.0.0 | Date: 2026-07-22 | Status: Approved

## 1. Architecture

`PoppedGameSession` remains the owner of gameplay state, audio playback,
analytics, completion persistence, and Arrival/Result routing. A scoped
`GameplayScreen` component renders only the active Gameplay category.

No API, database, admin, Arrival, or Result model changes are required.

## 2. Components

### PoppedGameSession

- Owns the persisted `GameSession` and completion result.
- Starts countdowns and playback for Play, Continue, and Next Clue; Repeat plays immediately.
- Classifies submissions as empty, duplicate, wrong, or correct.
- Persists completion before showing the transient Correct state.
- Supplies the existing countdown/audio overlay above `GameplayScreen`.

### GameplayScreen

- Renders the reserved More header, stage progress, Miss count, guess display,
  feedback toast, Repeat/Next/Reveal controls, and `EnglishKeyboard`.
- Measures the one-line guess and reduces its Inter Bold size only when it
  would exceed the fixed horizontal padding.
- Keeps controls visibly present but inert during countdown and guess feedback.
- Uses the same toast location for persistent runtime audio guidance.

### CompletedGameplayScreen

- Renders after Back from a Result that opened directly after completion.
- Keeps the More placeholder, final stage progress, and purple canonical answer.
- Removes Miss count, keyboard, Repeat, Next Clue, and Reveal controls.
- Provides See result and a launch-placeholder Archive action.
- A solved result uses its solved stage. A Reveal failure uses Last Stage and
  all seven completed progress segments.
- See result reopens Result without autoplay. Archive shows a non-blocking
  `Coming soon` toast above the answer.

### EnglishKeyboard

- Adds an optional disabled state used by countdown and feedback locks.
- Continues to emit only A-Z, Space, Backspace, and Enter actions.
- Does not register physical-keyboard listeners.

## 3. State Model

### Persistent state

The existing `GameSession` fields remain the source of truth:

- `currentStage`: stage restored by Continue.
- `guesses`: unique wrong guesses under answer-normalization equivalence.
- `repeatCount` and `hasUsedRepeat`: updated before Repeat playback starts.
- `startedAt`, puzzle identity, and existing completion fields: unchanged.

Draft text, countdown progress, and feedback animation state are intentionally
transient and are not restored after refresh.

### Transient state

- `countdownPlayback`: target stage and stage playback mode.
- `countdownValue`: `3` for first Play; `2` for Continue and Next.
- `guessFeedback`: `empty`, `wrong`, `duplicate`, or `correct`, plus
  `visible`/`exiting` animation phase.
- `audioMessage`: persistent gameplay playback guidance, cleared by successful
  playback.

## 4. Transitions

| Trigger | Immediate action | Countdown | Completion |
| --- | --- | --- | --- |
| Play | Create/reset session and prime audio | 3, 2, 1 | Play Stage 1 |
| Continue | Restore saved stage, clear draft, prime audio | 2, 1 | Replay saved stage |
| Repeat | Persist Repeat counters and preserve draft | None | Replay current stage immediately |
| Next Clue | Advance/persist stage, clear draft, prime audio | 2, 1 | Play target stage |
| Reveal Answer | Persist failed result | None | Show Result immediately |

Refreshing during a countdown restores the persisted target stage through the
Continue arrival screen and starts a fresh `2, 1` countdown after Continue.

## 5. Guess Classification

1. Trim the controlled keyboard value.
2. Empty: show `Guess Input`; do not persist.
3. Correct: persist completion immediately, show `Correct!` and the purple
   answer, then show Result after feedback exits.
4. Duplicate: compare both `normalizeAnswer` and `compactNormalizeAnswer`
   against stored wrong guesses; show `Already tried`; do not persist.
5. Wrong: append once, persist, show `Try Again`, and increase Miss count.

Empty, wrong, and duplicate text clears only after the feedback exits. Feedback
holds for 900ms and exits over 180ms. Keyboard and gameplay CTAs are inert for
the full 1.08 seconds. Correct feedback uses the same timing and keeps the
keyboard visible while hiding the CTA row without collapsing layout.

## 6. Audio Errors

The existing overlay remains responsible for countdown and playing visuals.
Runtime playback failures surface in the Gameplay toast area:

- Blocked playback: `Audio didn't start. Tap Repeat.`
- Other playback failure: `Audio couldn't play. Please try again.`

Unlike submission feedback, an audio error does not lock guessing or recovery
controls. A later successful playback clears the message.

## 7. Visual Constraints

- Mobile: white, edge-to-edge, full-height Gameplay surface.
- Desktop: centered mobile-width Gameplay surface on the existing outer field.
- Seven fixed progress segments; completed/current stages use the purple accent.
- Guess text uses Inter Bold at 28px until measured overflow requires shrinking.
- The caret blinks while editable and is absent in the Correct state.
- Countdown overlay uses a 60% black scrim and shows the underlying game UI.
- More is a visual placeholder only.

## 8. Verification

- Unit/type coverage for disabled keyboard behavior and answer normalization use.
- Browser flows for Play, Continue, Repeat, Next, empty, wrong, duplicate,
  correct, last-stage Reveal, and refresh restoration.
- Mobile and desktop screenshots checked for clipping, overlap, and overlay
  framing.
- Run lint, TypeScript, focused tests, and production build.
