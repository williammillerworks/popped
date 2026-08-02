# Pre-game and Audio Redesign Plan

> Version: 1.0.0 | Date: 2026-07-16 | Status: Approved

## Purpose

Implement only the approved Pre-game and Audio category screenshots and the
minimum gameplay behavior required to support them before the public launch.

## In Scope

- Render the 3, 2, 1 countdown over the Stage 1 gameplay screen at one-second intervals.
- Crossfade the countdown circle into a CSS-driven playback visualization.
- Show the playback visualization for initial stage playback, Next Clue, and immediate Repeat playback.
- Require the maximum gameplay clip window to be buffered before entering gameplay.
- Continue best-effort preview buffering after gameplay begins.
- Allow unlimited Repeat actions while tracking total uses and whether Repeat was used.
- Preserve existing Arrival, gameplay, result, scoring, reveal, and answer behavior otherwise.

## Out of Scope

- Real Web Audio amplitude analysis.
- Gameplay, result, or admin visual redesign outside these states.
- First-party audio ingestion, transcoding, or guaranteed full-file caching.
- Changes to client-side answer matching, unlimited guesses, reveal behavior, or result labels.

## Success Criteria

- Countdown displays over an inert but visible gameplay screen for one second per number.
- Successful snippet playback displays AUD-03 and exits when the clip finishes.
- All gameplay snippets use deterministic visual variation by stage and playback mode.
- Gameplay does not begin until its longest required clip is buffered.
- Repeat can be used multiple times per stage and survives refresh with accurate counts.
- Existing completion and resume behavior remains intact.
- Lint, TypeScript, production build, and browser flow verification pass.

## Risks

- Browser media preload is advisory. User-initiated priming is retained as a fallback before gameplay entry.
- Background buffering of the full preview is best effort and may still be browser-controlled.
- Existing local sessions use the former per-stage Repeat shape and require backward-compatible parsing.
