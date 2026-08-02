# Motion Polish Report

## Outcome

Popped now uses one motion language across Arrival, gameplay, completion, and
Result. Motion is short, purposeful, and interruptible, with no change to game
timings or state behavior.

## Delivered

- Shared motion duration and easing tokens
- Consistent press feedback
- Purposeful screen and feedback entrances
- In-place progress and artwork state transitions
- Reduced-motion support

## Validation

- `npm run lint`
- `npm run build`
- `node --test tests/result-redesign.test.mjs`
- Mobile browser flow at 393x852
