# arrival-polish - Plan

> Version: 1.0.0 | Date: 2026-07-23 | Status: Approved
> Level: Dynamic

## 1. Purpose

Polish the existing Arrival category against the approved 393 x 852 iPhone 16
screens while preserving the completed game-session, audio preparation, and
completion-lock behavior.

## 2. In Scope

- ARR-01 loading, ARR-02 new game, ARR-03 continue, ARR-04 completed today,
  ARR-05-A no puzzle, and ARR-05-B initial load error.
- Mobile-first central content composition using the supplied logo and Aleo.
- Responsive vertical spacing, safe-area padding, and overflow support for
  shorter mobile screens.
- Desktop presentation as a centered, capped mobile surface.
- A progressive loading bar with the existing 700 ms minimum loading period.
- Animated refresh ellipsis and state-specific button styling.
- Optional puzzle number and editor metadata when those values are available.

## 3. Out of Scope

- Gameplay, countdown, audio visualizer, Result, admin, scoring, or persistence
  behavior changes.
- Actual byte-level network progress reporting.
- Desktop-specific composition beyond centering the mobile surface.

## 4. Behavior Rules

- Loading advances visually toward 90 percent while resources are pending and
  completes only when the Arrival state is ready.
- Missing displays `We're sorry` and `No puzzle today`.
- Error displays the supplied error reason and a working refresh button.
- The refresh ellipsis cycles through one, two, and three dots without shifting
  the button label.
- Missing and error states render puzzle metadata only when supplied.
- Short viewports may scroll rather than overlap or shrink text illegibly.

## 5. Success Criteria

- All six Arrival states match the approved visual hierarchy at 393 x 852.
- Content remains readable and operable on shorter and wider mobile viewports.
- Loading never displays 100 percent while resources are still pending.
- Existing Play, Continue, Show Result, disabled wait, and refresh actions retain
  their current behavior.
- Relevant tests, TypeScript, lint, and production build pass.

## 6. Relevant Files

- `components/game/ArrivalScreen.tsx`
- `src/app/globals.css`
- `src/app/loading.tsx`
- `components/game/PoppedGame.tsx`
