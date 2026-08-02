# Motion Polish Design

## Motion Tokens

| Token | Value | Use |
| --- | --- | --- |
| Press | 120ms | Button and keyboard press feedback |
| Fast | 160ms | Toast exit and compact state changes |
| UI | 220ms | Entrance and progress feedback |
| Emphasis | 280ms | Result and arrival choreography |
| Ease out | cubic-bezier(0.16, 1, 0.3, 1) | Entering and leaving UI |
| Ease in-out | cubic-bezier(0.65, 0, 0.35, 1) | In-place morphs |
| Gentle | ease | Color, opacity, and background changes |

## Interaction Rules

- Buttons and keys compress to `scale(0.97)` while pressed.
- Press transitions list only the properties that change.
- Disabled controls do not animate.
- Keyboard input updates immediately; keys receive visual feedback only.

## Screen Rules

### Arrival

The logo, heading, action, and metadata settle in once with a small vertical
offset. The complete sequence stays brief and does not delay interaction.
Loading remains a time-oriented fill animation.

### Gameplay

Progress colors morph in place. Toasts enter and leave with the same ease-out
curve and never originate from zero scale. Correct-answer color receives a
short settle animation. Existing countdown duration and audio playback timing
remain unchanged.

### Result

Badge, message, statistics, player, and actions settle in as a restrained
sequence. Player controls and spoiler changes use interruptible transitions.

### Completed Gameplay

Progress, answer, and actions settle in once. Buttons share the same press
feedback as the rest of the product.

## Accessibility

`prefers-reduced-motion: reduce` removes decorative entrances, toast motion,
press transforms, and visualizer drift while preserving all content and state
changes.
