import assert from "node:assert/strict";
import test from "node:test";

import {
  getPoppedLogoLetterMotion,
  POPPED_LOGO_LETTERS,
  POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
  POPPED_LOGO_SOUND_CHECK_TIMELINE_MS,
} from "../lib/popped-logo-soundcheck.ts";

test("soundcheck uses the approved audio asset and six onset timecodes", () => {
  assert.equal(
    POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
    "/audio/popped-logo-sound-check.wav",
  );
  assert.deepEqual(POPPED_LOGO_SOUND_CHECK_TIMELINE_MS, [
    0, 190, 410, 515, 620, 760,
  ]);
  assert.equal(POPPED_LOGO_LETTERS.length, 6);
});

test("each letter motion pops, dips, and returns to its baseline once", () => {
  for (let letterIndex = 0; letterIndex < 6; letterIndex += 1) {
    const motion = getPoppedLogoLetterMotion(letterIndex);

    assert.equal(motion.keyframes.length, 4);
    assert.match(motion.keyframes[0].transform, /translate3d\(0, 0, 0\)/);
    assert.match(motion.keyframes[1].transform, /translate3d\(0, -[78]px, 0\)/);
    assert.match(motion.keyframes[2].transform, /translate3d\(0, 2px, 0\)/);
    assert.equal(motion.keyframes[3].transform, motion.keyframes[0].transform);
  }
});

test("the final D has the approved slightly stronger, longer settle", () => {
  const firstLetter = getPoppedLogoLetterMotion(0);
  const finalLetter = getPoppedLogoLetterMotion(5);

  assert.equal(firstLetter.durationMs, 235);
  assert.equal(finalLetter.durationMs, 260);
  assert.match(finalLetter.keyframes[1].transform, /-8px/);
});

test("letter motion rejects indexes outside the six-letter wordmark", () => {
  assert.throws(() => getPoppedLogoLetterMotion(-1), RangeError);
  assert.throws(() => getPoppedLogoLetterMotion(6), RangeError);
});
