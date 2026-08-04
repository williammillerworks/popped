import assert from "node:assert/strict";
import test from "node:test";

import {
  isAutoplayBlocked,
  prepareAudioForAudiblePlayback,
} from "../lib/audioPlayback.ts";

test("prepareAudioForAudiblePlayback restores a temporarily muted element", () => {
  const audio = { muted: true };

  prepareAudioForAudiblePlayback(audio);

  assert.equal(audio.muted, false);
});

test("prepareAudioForAudiblePlayback preserves an audible element", () => {
  const audio = { muted: false };

  prepareAudioForAudiblePlayback(audio);

  assert.equal(audio.muted, false);
});

test("isAutoplayBlocked recognizes browser permission denial", () => {
  assert.equal(
    isAutoplayBlocked(new DOMException("Playback denied", "NotAllowedError")),
    true,
  );
});

test("isAutoplayBlocked does not misclassify interrupted playback", () => {
  assert.equal(
    isAutoplayBlocked(new DOMException("Playback interrupted", "AbortError")),
    false,
  );
  assert.equal(isAutoplayBlocked(new Error("Playback failed")), false);
});
