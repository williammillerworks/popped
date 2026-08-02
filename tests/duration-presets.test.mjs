import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_DURATION_PRESET_ID,
  DURATION_PRESETS,
  DURATION_PRESET_IDS,
  TOTAL_STAGES,
  getStageDurationsForPreset,
} from "../config/game.ts";
import { validateAudioPreviewRange } from "../lib/audioPreviewValidation.ts";
import { parsePuzzleFormData } from "../lib/puzzleForm.ts";
import { getResultLabel } from "../lib/scoring.ts";

test("all versioned duration presets contain six increasing clues up to five seconds", () => {
  assert.equal(DEFAULT_DURATION_PRESET_ID, "classic_v1");
  assert.deepEqual(DURATION_PRESET_IDS, [
    "classic_v1",
    "balanced_v1",
    "generous_v1",
  ]);

  for (const preset of Object.values(DURATION_PRESETS)) {
    assert.equal(preset.stageDurations.length, TOTAL_STAGES);

    preset.stageDurations.forEach((duration, index) => {
      assert.ok(duration > 0);
      assert.ok(duration <= 5);

      if (index > 0) {
        assert.ok(duration > preset.stageDurations[index - 1]);
      }
    });
  }
});

test("preset duration arrays are returned as mutable snapshots", () => {
  const first = getStageDurationsForPreset("balanced_v1");
  const second = getStageDurationsForPreset("balanced_v1");

  first[0] = 99;

  assert.equal(second[0], 0.25);
  assert.equal(DURATION_PRESETS.balanced_v1.stageDurations[0], 0.25);
});

test("audio range validation blocks a 26-second start for a five-second clue", () => {
  const invalid = validateAudioPreviewRange({
    audioDurationSeconds: 30,
    previewStartSeconds: 26,
    stageDurations: getStageDurationsForPreset("generous_v1"),
  });
  const valid = validateAudioPreviewRange({
    audioDurationSeconds: 30,
    previewStartSeconds: 25,
    stageDurations: getStageDurationsForPreset("generous_v1"),
  });

  assert.equal(invalid?.valid, false);
  assert.equal(invalid?.remainingDurationSeconds, 4);
  assert.equal(invalid?.latestStartSeconds, 25);
  assert.match(invalid?.message ?? "", /25s or earlier/);
  assert.equal(valid?.valid, true);
});

test("admin form stores a valid preset and rejects unknown versions", () => {
  const validFormData = createPuzzleFormData("balanced_v1");
  const valid = parsePuzzleFormData(validFormData);

  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.puzzle.duration_preset_id, "balanced_v1");
  }

  const invalid = parsePuzzleFormData(createPuzzleFormData("custom"));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(
      invalid.state.errors.durationPresetId,
      "Choose a valid duration preset.",
    );
  }
});

test("Still Got It follows the six-stage final stage while Fast Ear remains active", () => {
  assert.equal(
    getResultLabel({
      hasUsedRepeat: true,
      puzzleId: "final-stage",
      puzzleNumber: 1,
      resultLabel: "",
      solved: true,
      solvedClipDuration: 3,
      solvedStage: TOTAL_STAGES,
      totalGuesses: 2,
      totalRepeatsUsed: 1,
    }),
    "Still Got It",
  );
  assert.equal(
    getResultLabel({
      hasUsedRepeat: true,
      puzzleId: "fast-ear",
      puzzleNumber: 2,
      resultLabel: "",
      solved: true,
      solvedClipDuration: 1,
      solvedStage: 4,
      totalGuesses: 2,
      totalRepeatsUsed: 1,
    }),
    "Fast Ear",
  );
});

function createPuzzleFormData(durationPresetId) {
  const formData = new FormData();
  const values = {
    acceptedAnswers: "LOVE DIVE",
    artistName: "IVE",
    canonicalAnswerEnglish: "LOVE DIVE",
    date: "2026-08-01",
    durationPresetId,
    editorId: "editor-1",
    previewStartSeconds: "10",
    previewUrl: "https://example.com/preview.m4a",
    songTitleEnglish: "LOVE DIVE",
    source: "manual",
    status: "draft",
  };

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}
