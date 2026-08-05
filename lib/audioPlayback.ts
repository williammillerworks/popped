export function seekAudio(audio: HTMLAudioElement, startSeconds: number) {
  return waitForAudioMetadata(audio).then(() => {
    const safeStartSeconds =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? Math.min(Math.max(0, startSeconds), Math.max(0, audio.duration - 0.05))
        : Math.max(0, startSeconds);

    audio.currentTime = safeStartSeconds;
    return safeStartSeconds;
  });
}

export function prepareAudioForAudiblePlayback(
  audio: Pick<HTMLMediaElement, "muted">,
) {
  audio.muted = false;
}

export function waitForAudioMetadata(audio: HTMLAudioElement) {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  audio.load();

  return new Promise<void>((resolve, reject) => {
    function cleanup() {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    }

    function handleLoadedMetadata() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error("Audio metadata could not load"));
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata, {
      once: true,
    });
    audio.addEventListener("error", handleError, { once: true });
  });
}

export function isAutoplayBlocked(error: unknown) {
  return (
    error instanceof DOMException &&
    error.name === "NotAllowedError"
  );
}
