# gameplay-redesign - Plan

> Version: 1.0.0 | Date: 2026-07-22 | Status: Approved
> Level: Dynamic

## 1. Purpose

Replace the current active-game card with the approved mobile-first GAME-01
through GAME-05 experience while preserving Arrival, Result, admin, scoring,
and client-side answer matching behavior outside the explicitly approved
changes.

## 2. In Scope

- White edge-to-edge mobile gameplay surface and centered mobile-width desktop surface.
- Reserved, non-functional More area.
- Seven-segment Stage progress, Miss count, and Last Stage variant.
- Controlled English keyboard integration with no physical-keyboard input.
- Centered uppercase guess with blinking caret and measured one-line font fitting.
- Initial Play countdown `3 -> 2 -> 1`.
- Continue and Next Clue countdown `2 -> 1` before playback; Repeat replays immediately.
- Empty, unique-wrong, duplicate, correct, and runtime-audio feedback states.
- `900ms` feedback hold plus `180ms` exit; guess controls are inert during guess feedback.
- Unique normalized wrong guesses as Misses, with `1 Miss` singular grammar.
- Correct state with purple answer, hidden CTAs, inert keyboard, then Result.
- Persistent gameplay audio error toast that clears after successful playback.

## 3. Out of Scope

- More menu behavior.
- Physical keyboard input.
- Number, punctuation, Korean, or keyboard-layer switching.
- Draft-guess persistence.
- Result, Arrival, admin, or database redesign.
- Changes to unlimited submissions, result-label priority, or client answer matching.

## 4. Behavior Rules

- Continue resumes the stored stage after a `2 -> 1` countdown and replays that stage.
- Repeat preserves the draft, records the click immediately, and replays without a countdown.
- Next Clue clears the draft, advances/persists the target stage, then counts down and plays it.
- Reveal Answer completes immediately without countdown.
- Empty guesses are not stored and do not add a Miss.
- Duplicate detection uses the same normalized and compact-normalized equivalence as answers.
- Wrong and duplicate guesses remain visible during feedback and clear after exit.
- Correct completion is persisted immediately; the Result appears after feedback exits.
- Refresh never restores an unsubmitted draft or a transient feedback/countdown state.

## 5. Success Criteria

- All supplied GAME screenshots have a corresponding reachable state.
- Refresh and Continue preserve stage, unique wrong guesses, Repeat totals, and completion lockout.
- Repeat plays immediately; Next and Continue play only after their two-second countdown.
- Duplicate guesses never increase Misses or result guess totals.
- Runtime audio failure remains understandable after the old audio card is removed.
- Lint, TypeScript, production build, and focused browser flows pass.

## 6. Risks

- Delayed playback may lose browser user activation; prime audio on the triggering CTA.
- Feedback timers can race with repeated input; make gameplay controls inert while active.
- Correct persistence can make Result render too early; prioritize the transient correct state.
- Very long strings can overflow; measure the rendered line and shrink within fixed padding.

## 7. Relevant Files

- `components/game/PoppedGame.tsx`
- `components/game/english-keyboard.tsx`
- `components/game/english-keyboard.module.css`
- `src/app/globals.css`
- `lib/answerMatching.ts`
- `lib/resultPersistence.ts`
- `types/game.ts`
