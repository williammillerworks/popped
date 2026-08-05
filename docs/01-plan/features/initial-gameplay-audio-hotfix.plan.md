# Initial Gameplay Audio Hotfix - Plan

> Version: 1.0.0 | Date: 2026-08-05 | Status: Approved
> Level: Dynamic

## 1. Overview

### 1.1 Purpose

Ensure that the first gameplay visit and every later stage produce audible audio,
while preserving countdown, buffering, Continue, Repeat, and browser autoplay
recovery behavior.

### 1.2 Background

The first Play path can run multiple muted priming operations concurrently.
Each operation snapshots and later restores `audio.muted`, so a nested operation
can snapshot the temporary `true` value and leave the shared audio element muted.
A refresh creates a new unmuted element and follows the different Continue path,
which explains why the issue appears to recover after reloading.

## 2. Goals

### 2.1 Primary Goals

- [x] Make muted buffer priming single-owner and safe under repeated calls.
- [x] Guarantee the intended audible state before stage and reveal playback.
- [x] Restore the approved Continue `2, 1` countdown and saved-stage replay.
- [x] Keep a user-action recovery path when audible autoplay is denied.
- [x] Add regression coverage for priming overlap and playback error classification.

### 2.2 Non-Goals

- Replace `HTMLAudioElement` with Web Audio.
- Change puzzle audio sources, duration presets, or admin behavior.
- Redesign the gameplay or result surfaces.

## 3. Scope

### 3.1 In Scope

- `components/game/PoppedGame.tsx` audio priming and entry transitions.
- `lib/audioPlayback.ts` reusable priming/error classification helpers.
- Focused unit tests for deterministic audio state transitions.

### 3.2 Out of Scope

- Database, Supabase, API, analytics schema, and deployment changes.

## 4. Success Criteria

- [x] Concurrent priming requests cannot leave the element muted.
- [x] First Play reaches Stage 1 with audible state restored before `play()`.
- [x] Next Clue and Repeat remain audible after initial entry.
- [x] Refresh and Continue run `2, 1` and replay the stored stage.
- [x] `NotAllowedError` is treated as autoplay denial; interruption errors are not.
- [x] Lint, TypeScript, focused tests, and production build pass.

## 5. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser autoplay still denies delayed audible playback | Stage does not start automatically | Preserve the Repeat recovery control and explicit blocked message. |
| Priming cleanup races with active playback | Playback is paused or remuted | Use one priming owner and cancel/finish it before real playback. |
| Continue behavior changes unexpectedly | Saved games do not replay | Test restored stage, countdown target, and playback transition. |

## 6. References

- `docs/02-design/features/pre-game-audio-redesign.design.md`
- `docs/02-design/features/gameplay-redesign.design.md`
- WebKit and Chrome autoplay policy documentation
