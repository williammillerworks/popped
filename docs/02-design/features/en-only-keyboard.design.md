# en-only-keyboard - Short Specification

> Version: 1.0.0 | Date: 2026-07-16 | Status: Approved
> Plan: `docs/01-plan/features/en-only-keyboard.plan.md`

## 1. Scope

The first version is a reusable on-screen English keyboard. It accepts English letters only and keeps future mode keys visible but inactive.

## 2. Keys

| Key | Visible | Enabled | Behavior |
|---|---:|---:|---|
| A-Z | Yes | Yes | Append the selected English letter to the input. |
| Space | Yes | Yes | Append one space. |
| Backspace | Yes | Yes | Remove the final input character; do nothing when empty. |
| Enter | Yes | Yes | Invoke the submit callback. |
| `123` | Yes | No | No input, mode change, or callback. |
| `한/영` | Yes | No | No input, language change, or callback. |

Disabled keys retain their designed size and position. They use a visually disabled state, expose disabled semantics to assistive technology, and have no pressed animation.

## 3. Input Rules

- Initial keyboard mode is English.
- Key labels use uppercase A-Z.
- Answer matching remains case-insensitive.
- Repeated spaces may be entered; existing answer normalization handles them.
- Numbers, punctuation, Korean input, and keyboard mode changes are unsupported.
- The puzzle catalog must exclude answers whose normalized English alias requires digits.

## 4. Component Contract

The keyboard is controlled by its parent and exposes only:

- current string value
- value-change callback
- submit callback

The keyboard must not contain POPPED game-state or answer-matching logic.

## 5. Layout

The en-only layout follows the approved keyboard reference. It keeps the future
number and language controls visible without adding a Shift key:

```text
Q W E R T Y U I O P
  A S D F G H J K L
[123] Z X C V B N M [Backspace]
[한/영]       [Space]       [Enter]
```

## 6. Acceptance Checks

- A-Z, Space, Backspace, and Enter behave as specified.
- `123` and `한/영` remain visible and cannot affect input or state.
- Enabled and disabled keys are visually and screen-reader distinguishable.
- Future language and special layers can be added without rebuilding the English layout.
