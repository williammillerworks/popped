# result-redesign - Plan

> Version: 1.0.0 | Date: 2026-07-22 | Status: Approved
> Level: Dynamic

## 1. Purpose

Replace the existing Result card with the approved mobile-first Newcomer,
Genius, Congratulations, and Not Today presentation while preserving Arrival,
Gameplay, admin, answer matching, completion lockout, and existing result-label
priority.

## 2. In Scope

- Newcomer, Genius, and default badge variants using the supplied PNG assets.
- Badge priority: Newcomer, then Genius, then default.
- Newcomer for the first locally completed puzzle, including a Reveal failure.
- Genius for a solved puzzle completed at Stage 1 or with zero Repeat uses.
- Default Congratulations for other solved results.
- Default layout with the existing Not Today copy for returning-player failures.
- Completed, Solve %, and completion Streak statistics from local results.
- Streak based on consecutive published puzzle numbers, not calendar dates.
- Shared shown/hidden song player with album art, Play/Pause, and persisted visibility.
- First completion opens shown and attempts the existing reveal autoplay.
- Completed-result revisit restores visibility and never autoplays.
- Back to puzzle returns to ARR-04 Completed Today without enabling replay.
- Existing share payload and result-label priority remain unchanged.

## 3. Out of Scope

- Arrival, Gameplay, admin, puzzle API, or database redesign.
- Accounts, remote result history, cross-device statistics, or server validation.
- Additional badge categories or changes to existing result labels.
- Share-card or share-text redesign.
- A bespoke failed-result screenshot beyond the approved Not Today fallback.

## 4. Behavior Rules

- A previous completion means a different locally stored finalized puzzle result.
- Newcomer wins when multiple badge conditions match.
- Genius requires a solved result.
- Completed includes solved and revealed results.
- Solve % is solved results divided by completed results, rounded to a whole percent.
- Streak counts the longest suffix of completed consecutive puzzle numbers ending
  at the current result; revisits never increment it.
- Hide pauses preview audio, hides song metadata, and persists the choice.
- Show reveals metadata but does not start audio.
- Play/Pause remains available in both shown and hidden states.
- Missing album art uses the approved iridescent fallback.

## 5. Success Criteria

- All supplied Result screenshots have a corresponding reachable state.
- First completion remains Newcomer on refresh and revisit.
- Genius and default classification follow the approved precedence.
- Statistics do not double-count revisits and survive refresh.
- Legacy stored results continue to open without invalidating completion lockout.
- Result revisit never starts audio automatically.
- X returns to ARR-04 and does not permit replay.
- Relevant tests, TypeScript, lint, and production build pass.

## 6. Risks

- Legacy results do not contain puzzle dates or visibility; parsing must use safe defaults.
- Browser-local history can be cleared and does not follow the player across devices.
- Result audio currently restarts instead of pausing; controls must not affect gameplay modes.
- Correct and Reveal transitions currently autoplay; revisit behavior must stay distinct.

## 7. Relevant Files

- `components/game/PoppedGame.tsx`
- `components/game/result-screen.tsx`
- `components/game/result-screen.module.css`
- `lib/resultPersistence.ts`
- `lib/result-presentation.ts`
- `types/game.ts`
- `public/badge-default.png`
- `public/badge-genius.png`
- `public/badge-newcomer.png`
