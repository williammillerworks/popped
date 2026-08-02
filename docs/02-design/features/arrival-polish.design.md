# arrival-polish - Design

> Version: 1.2.0 | Date: 2026-08-01 | Status: Approved
> Level: Dynamic | Plan: `docs/01-plan/features/arrival-polish.plan.md`

## 1. Architecture

`ArrivalScreen` remains the only renderer for the Arrival category. It receives
the existing state variant and optional puzzle metadata from the server route or
`PoppedGameSession`. No routing, session, audio, or result ownership moves into
the presentation component.

## 2. Layout

- The mobile surface fills the viewport edge to edge and respects safe areas.
- A central stack contains logo, state copy, CTA, and metadata in that order.
- The stack is positioned from the viewport center with bounded responsive
  spacing rather than fixed absolute coordinates.
- The 393 x 852 viewport is the reference size. Widths are capped in pixels and
  constrained by available inline space.
- Short viewports reduce vertical gaps and then scroll; text and controls do not
  scale with viewport width.
- At 540 px and wider, the existing centered mobile surface remains.

## 3. State Presentation

| Variant | Heading | CTA |
| --- | --- | --- |
| Loading | None | Progressive bar |
| New | Guess today's K-pop / in a second | Play |
| Continue | Welcome back! / You're on Stage N of 6 | Continue |
| Completed | Great job on today's puzzle! / Check out your result | Show Result |
| Missing | We're sorry / No puzzle today | Please wait... |
| Error | Something's wrong / supplied error reason | Please refresh + animated dots |

Date is rendered when supplied. Puzzle number and editor are independently
rendered when supplied, including missing and error states.

## 4. Loading Animation

The loading screen communicates preparation without claiming byte-level
progress:

- The fill begins near zero and advances in small, steady increments toward an
  86 percent soft cap while required data and audio are prepared. Early
  progress remains visibly active without making a large first jump.
- Loading progress is retained across the route fallback, hydration, and audio
  preparation render boundaries so the bar does not visibly restart.
- When the final preparation boundary reports completion, the fill reads its
  currently rendered position and uses a distance-aware duration to animate to
  100 percent. A low visible position receives a longer completion run than a
  nearly complete position. The fill briefly settles at 100 percent and only
  then reveals the selected Arrival state. The 700 ms server minimum remains
  unchanged.
- Motion uses transform and opacity only. Reduced-motion users see the completed
  state without the timed fill or exit transition.

A single playful K-pop preparation message appears below the bar. The message is
selected deterministically from a versioned list using the current Seoul
calendar date, so refreshes and re-entry show the same copy for that day. The
message remains stable during one load; only its trailing dots cycle through
`.`, `..`, and `...` in a fixed-width area. Assistive technology receives one
  stable sentence rather than the animated punctuation.

## 5. Resolved Arrival Entrance

Once loading has fully completed and exited, the resolved Arrival state enters
as four meaningful pieces: logo, state copy, CTA, and metadata. Each piece uses
the same 340 ms ease-out fade with an 8 px upward settle, staggered by 70 ms in
reading order. The sequence is intentionally short and does not alter layout or
delay the resolved state from mounting.

Only opacity and transform animate. The animation does not retain transform
styles after completion, so the CTA's existing press feedback remains intact.
Reduced-motion users receive the complete resolved state immediately.

## 6. Accessibility

- Loading keeps `aria-busy`, an accessible label, and a progressbar.
- The visual refresh dots are hidden from assistive technology; the accessible
  button name remains stable.
- Disabled and error button contrast remains state-specific.
- Safe-area padding and overflow preserve access to the CTA on small screens.

## 7. Data and API

No data model or API changes are required. Existing optional `date`,
`puzzleNumber`, `editorName`, and `errorMessage` props are sufficient.

## 8. Verification

- Component tests for state copy, metadata visibility, disabled state, and stable
  refresh accessible name.
- Browser screenshots at 393 x 852 and a shorter mobile viewport.
- Browser check at desktop width for the centered mobile surface.
- TypeScript, ESLint, focused tests, and production build.
