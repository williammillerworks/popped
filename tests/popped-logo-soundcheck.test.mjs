import assert from "node:assert/strict";
import test from "node:test";

import {
  configurePoppedLogoPlaybackAudioSession,
  getPoppedLogoVisualStartDelayMs,
  getPoppedLogoLetterMotion,
  POPPED_LOGO_LETTERS,
  POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
  POPPED_LOGO_SOUND_CHECK_SCHEDULE_LEAD_MS,
  POPPED_LOGO_SOUND_CHECK_TIMELINE_MS,
} from "../lib/popped-logo-soundcheck.ts";

test("soundcheck opts into the iOS media playback audio session", () => {
  const audioSession = { type: "ambient" };

  assert.equal(
    configurePoppedLogoPlaybackAudioSession({ audioSession }),
    true,
  );
  assert.equal(audioSession.type, "playback");
});

test("audio session configuration is a safe no-op when unsupported", () => {
  assert.equal(configurePoppedLogoPlaybackAudioSession({}), false);
});

test("audio session configuration tolerates a rejected WebKit setter", () => {
  const audioSession = {
    get type() {
      return "ambient";
    },
    set type(_value) {
      throw new Error("Audio session is unavailable");
    },
  };

  assert.equal(
    configurePoppedLogoPlaybackAudioSession({ audioSession }),
    false,
  );
});

test("soundcheck uses the approved audio asset and six onset timecodes", () => {
  assert.equal(
    POPPED_LOGO_SOUND_CHECK_AUDIO_SRC,
    "/audio/popped-logo-sound-check.wav",
  );
  assert.deepEqual(POPPED_LOGO_SOUND_CHECK_TIMELINE_MS, [
    0, 190, 410, 515, 620, 760,
  ]);
  assert.equal(POPPED_LOGO_LETTERS.length, 6);
  assert.equal(POPPED_LOGO_SOUND_CHECK_SCHEDULE_LEAD_MS, 60);
});

test("visual scheduling follows the audio output clock when available", () => {
  assert.equal(
    getPoppedLogoVisualStartDelayMs({
      contextTimeSeconds: 0.5,
      currentTimeSeconds: 0.5,
      outputPerformanceTimeMs: 1000,
      outputTimeSeconds: 0.45,
      performanceNowMs: 1010,
      startTimeSeconds: 0.56,
    }),
    100,
  );
});

test("visual scheduling falls back to the current audio clock", () => {
  assert.ok(
    Math.abs(
      getPoppedLogoVisualStartDelayMs({
        contextTimeSeconds: 0.5,
        currentTimeSeconds: 0.5,
        performanceNowMs: 1000,
        startTimeSeconds: 0.56,
      }) - 60,
    ) < 0.0001,
  );
});

test("visual scheduling ignores an unusable initial output timestamp", () => {
  assert.ok(
    Math.abs(
      getPoppedLogoVisualStartDelayMs({
        contextTimeSeconds: 0.5,
        currentTimeSeconds: 0.5,
        outputPerformanceTimeMs: 0,
        outputTimeSeconds: 0,
        performanceNowMs: 1000,
        startTimeSeconds: 0.56,
      }) - 60,
    ) < 0.0001,
  );
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
