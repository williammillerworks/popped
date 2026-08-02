# en-only-keyboard - Plan

> Version: 1.0.0 | Date: 2026-07-16 | Status: Approved

## Purpose

Build the first reusable POPPED custom keyboard with English input only, while preserving the final keyboard layout for future language and special-character support.

## Scope

- Enable A-Z, Space, Backspace, and Enter.
- Render `123` and `한/영` in their designed positions as disabled controls.
- Keep the keyboard reusable so the game can connect through value-change and submit events.
- Match the approved four-row English layout without a Shift key.
- Support only puzzle answers whose normalized English alias can be entered with A-Z and spaces.

## Out of Scope

- Numbers and punctuation input
- Korean input and Hangul composition
- Keyboard layer or language switching
- Integration with the live game screen

## Success Criteria

- All enabled keys have deterministic behavior.
- Future keys remain visible but cannot change input or keyboard state.
- The design does not require the layout to be rebuilt when future modes are enabled.

## Risk

Titles requiring digits cannot be entered until the special layer is implemented; puzzle selection must exclude them during this phase.
