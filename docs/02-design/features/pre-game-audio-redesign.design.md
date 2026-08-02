# Pre-game and Audio Redesign Design

> Version: 1.0.0 | Date: 2026-07-16 | Status: Approved
> Plan: `docs/01-plan/features/pre-game-audio-redesign.plan.md`

## Architecture

`PoppedGameSession` remains the owner of game and media state. The existing
gameplay content is rendered for both `countdown` and `active` states. A shared
modal overlay is layered over that content and makes it inert while visible.

The overlay has two variants:

- `countdown`: white circle with the current 3, 2, or 1 value.
- `playing`: iridescent CSS visualization with deterministic custom properties
  derived from stage and playback mode.

The existing `HTMLAudioElement` remains the only playback element. Media
progress events inspect `audio.buffered`; gameplay is ready when the range from
`previewStartSeconds` through the longest stage duration plus a 0.5 second
safety margin is buffered. Browsers that require a user gesture are primed from
the Play or Continue action while the Arrival loading screen remains visible.

## State Flow

1. Puzzle/session/result and audio metadata load.
2. Arrival action is requested.
3. If the gameplay range is buffered, enter countdown or restored gameplay.
4. Otherwise remain on Arrival loading while muted user-initiated playback
   primes the range.
5. New games render `3 -> 2 -> 1`, one second per value.
6. Successful stage playback crossfades to the playing visualization.
7. Clip completion removes the overlay and restores gameplay interaction.
8. Runtime blocked/error states remove the overlay and reuse existing in-game
   recovery messaging. Source/load errors before entry use ARR-05-B.

## Data Model

`GameSession` stores:

- `totalRepeatsUsed`: total Repeat button activations.
- `hasUsedRepeat`: whether any Repeat has been used.

`GameResult` also stores `hasUsedRepeat` for future achievement rendering.
Existing sessions containing `repeatsUsedByStage` are normalized by the parser;
the number of true stage entries becomes the initial total.

## Files

- `components/game/PoppedGame.tsx`: media readiness, overlays, transitions, Repeat behavior.
- `src/app/globals.css`: countdown, scrim, crossfade, and visualizer styling.
- `types/game.ts`: persisted Repeat fields.
- `lib/resultPersistence.ts`: backward-compatible persistence parsing.

## Verification

- Lint and TypeScript checks.
- Next.js production build.
- Browser verification of Play, 3/2/1 countdown, AUD-03, immediate repeated Repeat use,
  Next Clue playback, refresh/Continue, and runtime error recovery.
- Mobile and desktop screenshots plus reduced-motion inspection.

## Constraints

- No API or database changes.
- Full 30-second preview buffering remains best effort because browser preload
  policy controls network scheduling.
- Existing result UI, answer matching, reveal, and admin behavior are unchanged.
