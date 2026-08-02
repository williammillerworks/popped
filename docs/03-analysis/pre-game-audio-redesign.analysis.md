# Gap Analysis: Pre-game and Audio Redesign

> Date: 2026-07-16 | Design: `docs/02-design/features/pre-game-audio-redesign.design.md`

## Match Rate: 96%

## Implemented

- Countdown and playback share an inert overlay over the existing gameplay UI.
- Countdown runs 3, 2, 1 at one-second intervals and transitions to AUD-03.
- Initial stage, Next Clue, and Repeat use the same playback overlay.
- CSS custom properties vary playback motion deterministically by stage and mode.
- The longest gameplay clip plus safety margin is checked through `audio.buffered`.
- User-gesture priming keeps restricted browsers on Arrival until gameplay audio is ready.
- Runtime blocked/error handling remains in gameplay; pre-entry media errors use Arrival.
- Repeat is unlimited and total/boolean usage survives refresh.
- Legacy per-stage Repeat sessions are normalized when read.
- Lint, TypeScript, build, refresh/Continue, Repeat, Next Clue, and blocked playback pass.

## Remaining Gaps

- The automated browser blocked audio, so successful audible playback and the animated
  AUD-03 state could not be observed end to end in that environment.
- Full 30-second preview buffering is best effort through the browser's media preload
  policy and is not guaranteed by a first-party cache.

## Approved Deviations

- AUD-03 uses CSS animation rather than Web Audio amplitude analysis.
- Existing gameplay UI remains visible beneath the overlay and will be redesigned in
  its own category.

## Recommendation

Proceed to the next visual category after one manual audible playback check in a
browser where media playback is permitted.
