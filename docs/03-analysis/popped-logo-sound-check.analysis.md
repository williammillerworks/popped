# Gap Analysis: POPPED Logo Soundcheck

> Updated: 2026-08-21 | Design: `docs/02-design/popped-logo-sound-check.md`

## Match Rate: 94%

Fifteen of the sixteen implementation and verification groups in the approved
handoff were completed. The remaining group is direct execution in native
Safari and Firefox, which are not available in this environment.

## Implemented items

- Six intrinsic-ratio letter images in a reusable, baseline-stable wordmark.
- One reusable audio/motion owner and one reusable semantic replay button.
- Approved `0 / 190 / 410 / 515 / 620 / 760ms` visual timeline.
- Per-letter transform-only pop, dip, and single settle motion.
- Automatic replay after ARR loading and user-initiated replay.
- Decoded Web Audio buffer with a fresh `AudioBufferSourceNode` for every run;
  the previous source and all active animations are cancelled before restart.
- Feature-detected iOS Audio Session configuration requests `playback` before
  each run so Web Audio follows the same Ring/Silent behavior as media audio.
- One compositor-scheduled animation batch per run, aligned to the Web Audio
  output clock instead of six independent JavaScript timers.
- Silent visual fallback for rejected or delayed audible playback.
- Stationary reduced-motion path that preserves explicit audio playback.
- One 44px-high button hit area with icon, label, padding, pointer/touch,
  native Enter/Space behavior, visible focus, and restrained icon press feedback.
- Mobile and desktop ARR layout, automatic sequence, manual replay, rapid
  activation, keyboard focus, Play, and Continue verified in the in-app
  Chromium browser without console errors.
- Lint, standalone TypeScript, 34 tests, and Next.js production build passed.

## Remaining verification constraint

- An iPhone Safari pass exposed races between rapid `pause`, seek, `play`, and
  queued `playing` events in the former `HTMLAudioElement` implementation.
  Those operations were removed; a repeat native iPhone Safari pass remains.
- Firefox was not executable in the current workspace.
- Automated browser tooling cannot prove that the physical output device or tab
  was audible; the implementation deliberately makes no such claim.

## Safari hardening follow-up

- The visual fallback no longer calls `pause()` on an audio element. Once a
  fallback visual run starts, its pending decoded-audio attempt is invalidated
  and cannot begin late.
- Manual activation resumes `AudioContext` directly within the button gesture.
  Rapid activations stop the current one-shot source and create a new source at
  offset zero, so there is no seek or stale media-event queue.
- iOS Safari otherwise assigns Web Audio to its ambient audio session, which is
  muted by the Ring/Silent switch even while the gameplay `<audio>` element is
  audible. Supporting Safari versions now opt into the playback session;
  browsers without the Audio Session API safely retain their existing behavior.

## Recommendation

Repeat the rapid-activation and in-progress-restart cases on the reporting
iPhone Safari device, then perform the remaining native Firefox pass.
