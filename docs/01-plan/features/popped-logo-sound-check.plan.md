# POPPED Logo Soundcheck - Plan

> Version: 1.0.0 | Date: 2026-08-20 | Status: Approved
> Level: Dynamic

## Purpose

Implement GitHub Issue #6 using the approved sound, letter images, replay icon,
ARR placement reference, and motion handoff without changing unrelated game
entry or ARR behavior.

## Scope

- Replace the ARR wordmark image with six independently animated letter PNGs.
- Build reusable logo playback and replay-control components for later onboarding use.
- Start the synchronized sequence after ARR loading and restart it cleanly on demand.
- Preserve visual playback when autoplay is rejected and audio playback under reduced motion.
- Support a 44px touch target, native button keyboard behavior, and visible focus.
- Verify loading, replay cancellation, navigation, responsive layout, accessibility,
  browser audio fallbacks, lint, TypeScript, tests, and the production build.

## Non-goals

- No onboarding integration in this issue.
- No new animation dependency or changes to gameplay audio semantics.
- No redesign of ARR outside the supplied Soundcheck placement and logo replacement.

## Success criteria

- The `0 / 190 / 410 / 515 / 620 / 760ms` timeline drives independent letters.
- Rapid activation never overlaps audio or queues timers/animations.
- Autoplay rejection is handled silently while motion continues.
- Reduced-motion users receive stationary letters and working audio replay.
- Play/Continue transitions retain their existing behavior.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Browser autoplay rejection | Catch `play()` rejection and start the visual timeline independently. |
| Safari media timing/reset differences | Reuse one audio element, pause before seek, and tolerate early seek failure. |
| Replay overlap | Cancel listeners, timers, animations, and the active audio before every restart. |
| Logo layout shift | Preserve intrinsic image ratios in a fixed-ratio wordmark box. |

## References

- GitHub Issue #6
- `docs/02-design/popped-logo-sound-check.md`
- `docs/02-design/references/arr-soundcheck-button.png`
