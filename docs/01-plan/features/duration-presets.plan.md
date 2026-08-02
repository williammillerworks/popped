# Six-stage duration presets

## Goal

Move Popped from seven fixed stages to six stages and let an administrator
choose one versioned, increasing audio-duration preset per puzzle.

## Launch scope

- Six gameplay stages for every puzzle.
- Three immutable presets: `classic_v1`, `balanced_v1`, and `generous_v1`.
- `classic_v1` is the default for existing and newly created puzzles.
- Store the preset ID on each puzzle.
- Store the preset ID and resolved durations in an active local game session.
- Validate that the selected start point leaves enough audio for the longest
  stage whenever browser audio metadata is available.
- Warn when an administrator changes the preset on an already published puzzle.
- Keep the current result-label priority, updating final-stage semantics from
  stage 7 to stage 6.

## Out of scope

- Custom per-puzzle duration editing.
- More than three presets.
- Migration support for active seven-stage player sessions or old local results.
- Server-side gameplay-result persistence.

## Verification

- Preset configuration and boundary validation unit tests.
- Puzzle form parsing tests.
- Result-label regression tests.
- Existing gameplay, arrival, audio, and result tests.
- Type check, lint, production build, and mobile browser smoke test.
