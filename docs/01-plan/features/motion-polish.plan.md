# Motion Polish Plan

## Goal

Give Popped a consistent, responsive motion language inspired by Emil Kowalski
and animations.dev without changing gameplay behavior, timings, or screen
structure.

## Principles

- Animate only when motion clarifies feedback, hierarchy, or state change.
- Keep direct manipulation immediate and interruptible.
- Use short ease-out motion for entering and leaving UI.
- Use ease-in-out motion for elements that remain visible while changing state.
- Reserve linear motion for constant or time-based loops.
- Avoid `transition: all`.
- Preserve a complete reduced-motion experience.

## Scope

- Shared duration and easing tokens.
- Press feedback for buttons and keyboard keys.
- Subtle arrival and result entrance choreography.
- Gameplay progress, answer, toast, and completion feedback.
- Countdown and audio overlay easing polish.
- Reduced-motion coverage for all new effects.

## Out Of Scope

- Gameplay state or timer changes.
- New navigation behavior.
- New animation dependencies.
- Layout or visual redesign.
- Animating text entry or delaying repeated interactions.

## Verification

- Run lint and production build.
- Verify gameplay and result layouts at mobile and desktop widths.
- Confirm reduced-motion disables decorative motion.
