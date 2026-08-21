# POPPED Logo Soundcheck - Design Reference

> Status: Approved | Date: 2026-08-20

The complete and authoritative implementation handoff is:

`docs/02-design/popped-logo-sound-check.md`

Implement GitHub Issue #6 directly from that document, including its asset
paths, `0 / 190 / 410 / 515 / 620 / 760ms` timeline, motion keyframes,
autoplay fallback, restart cancellation, reduced-motion behavior,
accessibility requirements, and ARR placement reference.

## Integration structure

- A reusable client logo component owns one audio element, six independent
  letter elements, pending timers, active animations, and restart cleanup.
- A reusable semantic Soundcheck button invokes the component through a small
  imperative replay handle so ARR positioning remains separate from playback.
- Pure timing and motion data live outside the React component for focused tests
  and later onboarding reuse.
- ARR mounts the component only after its existing loading screen completes;
  unmount cleanup stops playback during Play/Continue navigation.

No behavior in this reference overrides the authoritative handoff.
