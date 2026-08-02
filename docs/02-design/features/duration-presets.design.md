# Six-stage duration presets design

## Presets

| ID | Display name | Stage durations |
| --- | --- | --- |
| `classic_v1` | Classic | 0.2, 0.4, 0.8, 1.2, 2.0, 3.0 seconds |
| `balanced_v1` | Balanced | 0.25, 0.5, 1.0, 1.6, 2.7, 4.0 seconds |
| `generous_v1` | Generous | 0.3, 0.6, 1.2, 2.0, 3.5, 5.0 seconds |

Preset definitions are immutable. Future tuning creates a new versioned ID
instead of changing an existing preset.

## Data model

- `puzzles.duration_preset_id` is required and defaults to `classic_v1`.
- The database constrains the value to the three launch preset IDs.
- The public puzzle response includes both `durationPresetId` and the resolved
  six-value `stageDurations` array.
- An active `GameSession` stores the preset ID and resolved array so a future
  preset release cannot change an in-progress game.
- Completed results remain browser-local. Analytics events do not represent a
  remotely persisted completion record.

## Admin behavior

- The puzzle form contains a required preset selector and a read-only preview of
  all six durations.
- The timestamp editor auditions the selected preset.
- Once audio metadata is available, validation compares:

  `previewStartSeconds + longestPresetDuration <= audioDuration`

- Invalid example: a 30-second preview, 26-second start, and a 5-second longest
  stage leaves only 4 seconds, so the form is blocked and recommends a start at
  25 seconds or earlier.
- While metadata is loading, save is temporarily blocked. A metadata load error
  keeps the existing audio-load error behavior and does not invent a duration.
- Changing the preset of an initially published puzzle displays a warning before
  save. The warning does not block an intentional update.

## Gameplay and result behavior

- Progress indicators render six segments.
- Stage 6 is the Last Stage and Reveal Answer remains the terminal action.
- All playback, buffering, solved-duration reporting, and repeat behavior use
  the puzzle's resolved duration array.
- `Still Got It` means solved on `TOTAL_STAGES`; `Fast Ear` remains based on a
  solved clip of at most one second. These labels are currently used in stored
  result/share text, even though the redesigned result screen shows badges
  instead of the label.

## Failure handling

- Unknown or missing preset IDs fall back to `classic_v1` when reading legacy
  rows.
- The server rejects unknown preset IDs submitted by the admin form.
- Invalid duration arrays fall back to `classic_v1` in the gameplay client.
