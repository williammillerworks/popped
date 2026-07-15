"use client";

import type { FormEvent, ReactNode } from "react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  STAGE_DURATIONS_SECONDS,
  TOTAL_STAGES,
  type StageNumber,
} from "../../config/game";
import { isCorrectGuess } from "../../lib/answerMatching";
import {
  clearStoredSession,
  getStoredSessionValue,
  getStoredResultValue,
  parseStoredSession,
  parseStoredResult,
  saveStoredResult,
  saveStoredSession,
  subscribeToStoredResultChanges,
} from "../../lib/resultPersistence";
import { isAutoplayBlocked, seekAudio } from "../../lib/audioPlayback";
import { trackAnalyticsEvent } from "../../lib/analytics";
import { getResultLabel } from "../../lib/scoring";
import { createShareText } from "../../lib/share";
import type { TodayPuzzleResponse } from "../../lib/puzzles";
import type { GameResult, GameSession } from "../../types/game";

type GameState = "pre-start" | "countdown" | "active" | "solved" | "failed";
type PlaybackMode = "stage" | "repeat" | "reveal";
type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "blocked"
  | "finished"
  | "error";
type PlaybackState = {
  playId: number;
  mode: PlaybackMode;
  status: PlaybackStatus;
  stage?: StageNumber;
  durationSeconds?: number;
  message: string;
};

const COUNTDOWN_STEP_MS = 700;

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function getServerStoredResultValue() {
  return null;
}

function getServerStoredSessionValue() {
  return null;
}

function getPlayableStageDurations(stageDurations: number[]) {
  if (stageDurations.length === TOTAL_STAGES) {
    return stageDurations;
  }

  return [...STAGE_DURATIONS_SECONDS];
}

export function PoppedGame({ puzzle }: { puzzle: TodayPuzzleResponse }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activePlayIdRef = useRef(0);
  const stopIntervalRef = useRef<number | null>(null);
  const hasRestoredStoredSessionRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>("pre-start");
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [repeatsUsedByStage, setRepeatsUsedByStage] = useState<
    Partial<Record<StageNumber, boolean>>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(
    null,
  );
  const [solvedStage, setSolvedStage] = useState<StageNumber | null>(null);
  const [showSpoiler, setShowSpoiler] = useState(true);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);
  const [hasPreparedAudio, setHasPreparedAudio] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    playId: 0,
    mode: "stage",
    status: "idle",
    message: "Audio ready.",
  });

  const hasCheckedStoredResult = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const storedResultValue = useSyncExternalStore(
    subscribeToStoredResultChanges,
    () => getStoredResultValue(puzzle.id),
    getServerStoredResultValue,
  );
  const storedSessionValue = useSyncExternalStore(
    subscribeToStoredResultChanges,
    () => getStoredSessionValue(puzzle.id),
    getServerStoredSessionValue,
  );
  const storedResult = parseStoredResult(storedResultValue);
  const storedSession = parseStoredSession(storedSessionValue);
  const stageDurations = getPlayableStageDurations(puzzle.stageDurations);
  const stageIndex = currentStage - 1;
  const clipDuration = stageDurations[stageIndex];
  const clipDurationLabel = formatDuration(clipDuration);
  const totalGuesses = guesses.length;
  const totalRepeatsUsed =
    Object.values(repeatsUsedByStage).filter(Boolean).length;
  const solvedClipDuration =
    solvedStage === null ? undefined : stageDurations[solvedStage - 1];
  const liveResult =
    gameState === "solved" || gameState === "failed"
      ? createGameResult({
          puzzleId: puzzle.id,
          puzzleNumber: puzzle.puzzleNumber,
          solved: gameState === "solved",
          solvedStage: solvedStage ?? undefined,
          solvedClipDuration,
          totalGuesses,
          totalRepeatsUsed,
        })
      : null;
  const persistedResult = completedResult ?? storedResult;
  const result = persistedResult ?? liveResult;

  const playCountdownStage = useEffectEvent(() => {
    setGameState("active");
    void playStage(currentStage, "stage");
  });

  useEffect(() => {
    const audio = new Audio(puzzle.previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    function handleLoadedMetadata() {
      setHasPreparedAudio(true);
    }

    function handleError() {
      clearStopInterval();
      setHasPreparedAudio(true);
      trackAnalyticsEvent("audio_error", {
        puzzleNumber: puzzle.puzzleNumber,
        reason: "load_failed",
      });
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        status: "error",
        message: "Audio could not load. Please try again.",
      }));
      setAudioMessage("Audio could not load. Please try again.");
    }

    function handleEnded() {
      clearStopInterval();
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        status: "finished",
        message: getFinishedPlaybackMessage(currentPlayback),
      }));
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata, {
      once: true,
    });
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    audio.load();

    const readyStateTimer = window.setTimeout(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setHasPreparedAudio(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(readyStateTimer);
      clearStopInterval();
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [puzzle.previewUrl, puzzle.puzzleNumber]);

  useEffect(() => {
    if (
      !hasCheckedStoredResult ||
      persistedResult ||
      hasRestoredStoredSessionRef.current
    ) {
      return;
    }

    hasRestoredStoredSessionRef.current = true;

    if (!storedSession) {
      return;
    }

    const restoreTimer = window.setTimeout(() => {
      setGameState("active");
      setCountdownValue(3);
      setCurrentStage(storedSession.currentStage);
      setGuess("");
      setGuesses(storedSession.guesses);
      setRepeatsUsedByStage(storedSession.repeatsUsedByStage);
      setFeedback(`Stage ${storedSession.currentStage} restored.`);
      setAudioMessage(null);
      setPersistenceMessage(null);
      setSolvedStage(storedSession.solvedStage ?? null);
      setStartedAt(storedSession.startedAt ?? new Date().toISOString());
      setShowSpoiler(true);
      setPlayback({
        durationSeconds: stageDurations[storedSession.currentStage - 1],
        mode: "stage",
        playId: activePlayIdRef.current,
        stage: storedSession.currentStage,
        status: "idle",
        message: `Stage ${storedSession.currentStage} ready.`,
      });
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [
    hasCheckedStoredResult,
    persistedResult,
    stageDurations,
    storedSession,
  ]);

  useEffect(() => {
    if (gameState !== "countdown") {
      return;
    }

    const timer = window.setTimeout(() => {
      if (countdownValue === 1) {
        playCountdownStage();
        return;
      }

      setCountdownValue((value) => value - 1);
    }, COUNTDOWN_STEP_MS);

    return () => window.clearTimeout(timer);
  }, [countdownValue, gameState]);

  function startGame() {
    if (persistedResult) {
      return;
    }

    const nextStartedAt = new Date().toISOString();

    stopCurrentPlayback();
    activePlayIdRef.current = 0;
    setGameState("countdown");
    setCountdownValue(3);
    setCurrentStage(1);
    setGuess("");
    setGuesses([]);
    setStartedAt(nextStartedAt);
    setRepeatsUsedByStage({});
    setFeedback(null);
    setAudioMessage(null);
    setPersistenceMessage(null);
    setSolvedStage(null);
    setShowSpoiler(true);
    setPlayback({
      playId: 0,
      mode: "stage",
      status: "idle",
      message: "Audio ready.",
    });
    trackAnalyticsEvent("game_started", {
      puzzleNumber: puzzle.puzzleNumber,
    });
    persistGameSession({
      currentStage: 1,
      guesses: [],
      repeatsUsedByStage: {},
      startedAt: nextStartedAt,
    });
    primeAudioForMobile();
  }

  function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedGuess = guess.trim();

    if (!trimmedGuess) {
      setFeedback("Type a song title first.");
      return;
    }

    const nextGuesses = [...guesses, trimmedGuess];
    setGuesses(nextGuesses);
    persistGameSession({
      guesses: nextGuesses,
    });
    trackAnalyticsEvent("guess_submitted", {
      guessNumber: nextGuesses.length,
      puzzleNumber: puzzle.puzzleNumber,
      stage: currentStage,
    });

    if (
      isCorrectGuess(trimmedGuess, [
        puzzle.canonicalAnswerEnglish,
        puzzle.canonicalAnswerKorean ?? "",
        ...puzzle.acceptedAnswers,
      ])
    ) {
      const completedGameResult = createGameResult({
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        solved: true,
        solvedStage: currentStage,
        solvedClipDuration: stageDurations[currentStage - 1],
        totalGuesses: nextGuesses.length,
        totalRepeatsUsed,
      });

      trackAnalyticsEvent("guess_correct", {
        guessNumber: nextGuesses.length,
        puzzleNumber: puzzle.puzzleNumber,
        stage: currentStage,
      });
      setSolvedStage(currentStage);
      setCompletedResult(completedGameResult);
      setGameState("solved");
      setFeedback("Popped.");
      setShowSpoiler(true);
      saveCompletedResult(completedGameResult);
      void playRevealPreview();
      return;
    }

    setGuess("");
    setFeedback("Not it. Try another title.");
  }

  function useRepeat() {
    if (repeatsUsedByStage[currentStage]) {
      return;
    }

    const nextRepeatsUsedByStage = {
      ...repeatsUsedByStage,
      [currentStage]: true,
    };

    setRepeatsUsedByStage(nextRepeatsUsedByStage);
    persistGameSession({
      repeatsUsedByStage: nextRepeatsUsedByStage,
    });
    setFeedback(`Repeating Stage ${currentStage}. No countdown this time.`);
    trackAnalyticsEvent("repeat_used", {
      puzzleNumber: puzzle.puzzleNumber,
      repeatCount: totalRepeatsUsed + 1,
      stage: currentStage,
    });
    void playStage(currentStage, "repeat");
  }

  function goToNextClue() {
    if (currentStage === TOTAL_STAGES) {
      const completedGameResult = createGameResult({
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.puzzleNumber,
        solved: false,
        totalGuesses,
        totalRepeatsUsed,
      });

      setCompletedResult(completedGameResult);
      setGameState("failed");
      setShowSpoiler(true);
      setFeedback("Reveal time.");
      trackAnalyticsEvent("answer_revealed", {
        guessCount: totalGuesses,
        puzzleNumber: puzzle.puzzleNumber,
        repeatCount: totalRepeatsUsed,
      });
      saveCompletedResult(completedGameResult);
      void playRevealPreview();
      return;
    }

    const nextStage = (currentStage + 1) as StageNumber;

    trackAnalyticsEvent("next_clue_clicked", {
      fromStage: currentStage,
      puzzleNumber: puzzle.puzzleNumber,
      toStage: nextStage,
    });
    setCurrentStage(nextStage);
    setGuess("");
    persistGameSession({
      currentStage: nextStage,
    });
    setFeedback(`Stage ${nextStage} is playing. Repeat is available again.`);
    void playStage(nextStage, "stage");
  }

  function playStage(
    stage: StageNumber,
    mode: Extract<PlaybackMode, "stage" | "repeat">,
  ) {
    return playFromPreviewStart({
      durationSeconds: stageDurations[stage - 1],
      mode,
      stage,
    });
  }

  function playRevealPreview() {
    return playFromPreviewStart({
      mode: "reveal",
    });
  }

  async function playFromPreviewStart({
    durationSeconds,
    mode,
    stage,
  }: {
    durationSeconds?: number;
    mode: PlaybackMode;
    stage?: StageNumber;
  }) {
    const audio = audioRef.current;

    if (!audio) {
      setAudioMessage("Audio is not ready yet. Please try again.");
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        status: "error",
        message: "Audio is not ready yet.",
      }));
      trackAnalyticsEvent("audio_error", {
        mode,
        puzzleNumber: puzzle.puzzleNumber,
        reason: "audio_not_ready",
        stage: stage ?? null,
      });
      return false;
    }

    const playId = activePlayIdRef.current + 1;
    activePlayIdRef.current = playId;
    clearStopInterval();
    audio.pause();
    setAudioMessage(null);
    setPlayback({
      durationSeconds,
      mode,
      playId,
      stage,
      status: "loading",
      message: getLoadingPlaybackMessage(mode, stage),
    });

    try {
      const actualStartSeconds = await seekAudio(
        audio,
        puzzle.previewStartSeconds,
      );
      await audio.play();

      if (activePlayIdRef.current !== playId) {
        return true;
      }

      setPlayback({
        durationSeconds,
        mode,
        playId,
        stage,
        status: "playing",
        message: getPlayingPlaybackMessage(mode, stage),
      });
      trackPlaybackStarted({
        durationSeconds,
        mode,
        puzzleNumber: puzzle.puzzleNumber,
        stage,
      });

      if (durationSeconds !== undefined) {
        const stopAtSeconds = actualStartSeconds + durationSeconds;

        stopIntervalRef.current = window.setInterval(() => {
          if (activePlayIdRef.current !== playId) {
            clearStopInterval();
            return;
          }

          if (audio.currentTime >= stopAtSeconds || audio.ended) {
            audio.pause();
            clearStopInterval();
            setPlayback({
              durationSeconds,
              mode,
              playId,
              stage,
              status: "finished",
              message: getFinishedPlaybackMessage({ mode, stage }),
            });
          }
        }, 10);
      }

      return true;
    } catch (error) {
      if (activePlayIdRef.current !== playId) {
        return false;
      }

      const blocked = isAutoplayBlocked(error);
      const message = blocked
        ? getAutoplayBlockedMessage(mode)
        : "Audio could not play. Please try again.";

      setPlayback({
        durationSeconds,
        mode,
        playId,
        stage,
        status: blocked ? "blocked" : "error",
        message,
      });
      setAudioMessage(message);
      trackAnalyticsEvent("audio_error", {
        mode,
        puzzleNumber: puzzle.puzzleNumber,
        reason: blocked ? "autoplay_blocked" : "play_failed",
        stage: stage ?? null,
      });
      return false;
    }
  }

  function toggleSpoilerVisibility() {
    setShowSpoiler((visible) => {
      const nextVisible = !visible;

      trackAnalyticsEvent(nextVisible ? "spoiler_shown" : "spoiler_hidden", {
        puzzleNumber: puzzle.puzzleNumber,
      });

      return nextVisible;
    });
  }

  function primeAudioForMobile() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const expectedPlayId = activePlayIdRef.current;
    const wasMuted = audio.muted;
    audio.muted = true;

    void audio
      .play()
      .then(() => {
        if (activePlayIdRef.current === expectedPlayId) {
          audio.pause();
          audio.currentTime = puzzle.previewStartSeconds;
        }
      })
      .catch(() => {
        if (activePlayIdRef.current === expectedPlayId) {
          audio.load();
        }
      })
      .finally(() => {
        audio.muted = wasMuted;
      });
  }

  function stopCurrentPlayback() {
    activePlayIdRef.current += 1;
    clearStopInterval();
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
    }
  }

  function clearStopInterval() {
    if (stopIntervalRef.current !== null) {
      window.clearInterval(stopIntervalRef.current);
      stopIntervalRef.current = null;
    }
  }

  function showPersistenceMessageIfNeeded(wasSaved: boolean) {
    setPersistenceMessage(
      wasSaved
        ? null
        : "Your result is shown here, but this browser blocked local saving. A refresh may start today again.",
    );
  }

  function persistGameSession(
    session: Partial<
      Pick<GameSession, "currentStage" | "guesses" | "repeatsUsedByStage">
    > & {
      startedAt?: string;
    } = {},
  ) {
    if (persistedResult) {
      return;
    }

    const nextSession: GameSession = {
      puzzleId: puzzle.id,
      startedAt: session.startedAt ?? startedAt ?? new Date().toISOString(),
      currentStage: session.currentStage ?? currentStage,
      guesses: session.guesses ?? guesses,
      repeatsUsedByStage: session.repeatsUsedByStage ?? repeatsUsedByStage,
      solved: false,
      revealed: false,
    };

    saveStoredSession(nextSession);
  }

  function saveCompletedResult(completedGameResult: GameResult) {
    const wasSaved = saveStoredResult(completedGameResult);
    clearStoredSession(completedGameResult.puzzleId);
    showPersistenceMessageIfNeeded(wasSaved);
  }

  if (!hasCheckedStoredResult || !hasPreparedAudio) {
    return (
      <PageShell eyebrow="Loading" puzzleNumber={puzzle.puzzleNumber}>
        <section className="flex flex-1 items-center justify-center">
          <p className="rounded-3xl bg-white/65 px-5 py-4 text-center text-sm font-bold text-[#5f5148]">
            Loading today&apos;s game...
          </p>
        </section>
      </PageShell>
    );
  }

  if (result) {
    return (
      <PageShell
        eyebrow={result.solved ? "Popped" : "Reveal"}
        puzzleNumber={puzzle.puzzleNumber}
      >
        <ResultCard
          audioMessage={audioMessage}
          onPlayRevealPreview={() => void playRevealPreview()}
          persistenceMessage={persistenceMessage}
          playback={playback}
          puzzle={puzzle}
          result={result}
          showSpoiler={showSpoiler}
          toggleSpoiler={toggleSpoilerVisibility}
        />
      </PageShell>
    );
  }

  if (gameState === "pre-start") {
    return (
      <PageShell eyebrow="Daily K-pop" puzzleNumber={puzzle.puzzleNumber}>
        <section className="flex flex-1 flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="space-y-4 pt-2">
              <p className="font-mono text-xs font-black uppercase tracking-[0.32em] text-[#b05f3c]">
                Hear. Know. Guess.
              </p>
              <h1 className="text-[4.5rem] font-black leading-[0.82] tracking-[-0.09em] sm:text-7xl">
                POPPED
              </h1>
              <p className="max-w-xs text-xl font-semibold leading-8 text-[#5f5148]">
                Guess today&apos;s K-pop song from tiny audio clues.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-[#201813]/10 bg-white/70 p-5 shadow-inner shadow-white">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a5f3b]">
                Today&apos;s Puzzle
              </p>
              <p className="mt-3 text-base font-semibold leading-7 text-[#5f5148]">
                Listen closely. The answer is song title only, and English or
                Korean aliases can both work.
              </p>
            </div>
          </div>

          <button className={primaryButtonClass} type="button" onClick={startGame}>
            Start
          </button>
        </section>
      </PageShell>
    );
  }

  if (gameState === "countdown") {
    return (
      <PageShell eyebrow="Get ready" puzzleNumber={puzzle.puzzleNumber}>
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <p className="font-mono text-xs font-black uppercase tracking-[0.35em] text-[#b05f3c]">
            Stage 1 starts after
          </p>
          <div
            aria-live="polite"
            className="popped-countdown-pulse grid size-44 place-items-center rounded-full border border-[#201813]/10 bg-[#201813] font-mono text-8xl font-black tabular-nums text-[#fffaf1] shadow-[0_22px_70px_rgba(32,24,19,0.2)]"
            key={countdownValue}
          >
            {countdownValue}
          </div>
          <p className="max-w-xs text-base font-semibold leading-7 text-[#5f5148]">
            Audio starts from {formatDuration(puzzle.previewStartSeconds)}s
            after the countdown.
          </p>
        </section>
      </PageShell>
    );
  }

  if (gameState === "active") {
    return (
      <PageShell eyebrow="Now playing" puzzleNumber={puzzle.puzzleNumber}>
        <section className="flex flex-1 flex-col gap-5">
          <StageHeader
            clipDurationLabel={clipDurationLabel}
            currentStage={currentStage}
            key={currentStage}
          />

          <AudioStatusCard
            audioMessage={audioMessage}
            playback={playback}
            previewStartSeconds={puzzle.previewStartSeconds}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Guesses" value={totalGuesses.toString()} />
            <Stat label="Repeats" value={totalRepeatsUsed.toString()} />
          </div>

          <form className="space-y-3.5" onSubmit={submitGuess}>
            <label
              className="text-xs font-black uppercase tracking-[0.18em] text-[#5f5148]"
              htmlFor="song-guess"
            >
              Guess the song title
            </label>
            <input
              className="h-16 w-full rounded-[1.35rem] border border-[#201813]/15 bg-white px-4 text-xl font-bold text-[#201813] shadow-sm outline-none transition placeholder:text-[#8a5f3b]/55 focus:border-[#b05f3c] focus:ring-4 focus:ring-[#b05f3c]/15"
              id="song-guess"
              onChange={(event) => setGuess(event.target.value)}
              placeholder="Song title"
              type="text"
              value={guess}
            />
            <button className={primaryButtonClass} type="submit">
              Submit
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              className={secondaryButtonClass}
              disabled={Boolean(repeatsUsedByStage[currentStage])}
              onClick={useRepeat}
              type="button"
            >
              {repeatsUsedByStage[currentStage] ? "Repeated" : "Repeat"}
            </button>
            <button
              className={secondaryButtonClass}
              onClick={goToNextClue}
              type="button"
            >
              {currentStage === TOTAL_STAGES ? "Reveal Answer" : "Next Clue"}
            </button>
          </div>

          <ProgressDots
            currentStage={currentStage}
            stageDurations={stageDurations}
          />

          {feedback ? (
            <p
              aria-live="polite"
              className="rounded-2xl bg-[#f1dfca] px-4 py-3 text-sm font-bold text-[#5f5148]"
            >
              {feedback}
            </p>
          ) : null}
        </section>
      </PageShell>
    );
  }

  return null;
}

function PageShell({
  children,
  eyebrow,
  puzzleNumber,
}: {
  children: ReactNode;
  eyebrow: string;
  puzzleNumber: number | null;
}) {
  return (
    <main className="popped-app-shell px-3 py-3 sm:px-6 sm:py-6">
      <section className="popped-game-card mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col gap-6 rounded-[1.75rem] p-4 sm:min-h-[calc(100dvh-3rem)] sm:p-6">
        <div className="popped-shell-bar flex items-center justify-between rounded-full px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em]">
          <span>{eyebrow}</span>
          <span className="font-mono tabular-nums">#{puzzleNumber ?? "test"}</span>
        </div>
        {children}
      </section>
    </main>
  );
}

function StageHeader({
  clipDurationLabel,
  currentStage,
}: {
  clipDurationLabel: string;
  currentStage: StageNumber;
}) {
  return (
    <div className="popped-stage-snap rounded-[1.75rem] bg-[#f1dfca] p-5 shadow-inner shadow-white">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a5f3b]">
            Stage
          </p>
          <h1 className="mt-2 font-mono text-5xl font-black tracking-[-0.08em] tabular-nums">
            {currentStage} / {TOTAL_STAGES}
          </h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-4xl font-black tabular-nums">
            {clipDurationLabel}s
          </p>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a5f3b]">
            clip
          </p>
        </div>
      </div>
    </div>
  );
}

function AudioStatusCard({
  audioMessage,
  playback,
  previewStartSeconds,
}: {
  audioMessage: string | null;
  playback: PlaybackState;
  previewStartSeconds: number;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[#201813]/10 bg-white/75 p-4 shadow-inner shadow-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a5f3b]">
            Audio
          </p>
          <p className="mt-2 text-sm font-bold text-[#5f5148]">
            Starts at {formatDuration(previewStartSeconds)}s
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${getPlaybackBadgeClass(
            playback.status,
          )}`}
        >
          {playback.status}
        </span>
      </div>

      <div className="mt-4 flex h-28 items-center justify-center rounded-[1.5rem] bg-[#201813] text-center text-[#fffaf1] shadow-[inset_0_0_0_1px_rgba(255,250,241,0.08)]">
        <div>
          <p className="font-mono text-4xl font-black tabular-nums">
            {playback.durationSeconds !== undefined
              ? `${formatDuration(playback.durationSeconds)}s`
              : "preview"}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#e9d7c0]">
            {playback.message}
          </p>
        </div>
      </div>

      {audioMessage ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl bg-[#ffe7da] px-4 py-3 text-sm font-bold text-[#8b321d]"
        >
          {audioMessage}
        </p>
      ) : null}
    </div>
  );
}

function ProgressDots({
  currentStage,
  stageDurations,
}: {
  currentStage: StageNumber;
  stageDurations: number[];
}) {
  return (
    <div className="grid grid-cols-7 gap-2" aria-label="Stage progress">
      {stageDurations.map((duration, index) => {
        const stageNumber = (index + 1) as StageNumber;
        const isCurrent = stageNumber === currentStage;
        const isCurrentOrPast = stageNumber <= currentStage;

        return (
          <div
            className={`h-2 rounded-full transition-[background-color,transform,opacity] duration-200 ${
              isCurrentOrPast ? "bg-[#201813]" : "bg-[#201813]/15"
            } ${isCurrent ? "scale-y-125" : "scale-y-100"}`}
            key={`${stageNumber}-${duration}`}
          />
        );
      })}
    </div>
  );
}

function ResultCard({
  audioMessage,
  onPlayRevealPreview,
  persistenceMessage,
  playback,
  puzzle,
  result,
  showSpoiler,
  toggleSpoiler,
}: {
  audioMessage: string | null;
  onPlayRevealPreview: () => void;
  persistenceMessage: string | null;
  playback: PlaybackState;
  puzzle: TodayPuzzleResponse;
  result: GameResult;
  showSpoiler: boolean;
  toggleSpoiler: () => void;
}) {
  const resultSummary =
    result.solved &&
    result.solvedStage &&
    result.solvedClipDuration !== undefined
      ? `Solved at Stage ${result.solvedStage} in ${formatDuration(
          result.solvedClipDuration,
        )}s.`
      : "The reveal preview starts from the puzzle timestamp.";
  const resultTone = result.solved ? "Popped." : "Not Today";

  return (
    <section className="flex flex-1 flex-col gap-4">
      <div className="space-y-2 pt-1">
        <p className="font-mono text-xs font-black uppercase tracking-[0.35em] text-[#6f6a61]">
          Result
        </p>
        <h1 className="text-5xl font-black leading-none tracking-[-0.07em] text-[#111111]">
          {resultTone}
        </h1>
        <p className="text-base font-semibold leading-7 text-[#6f6a61]">
          {resultSummary}
        </p>
      </div>

      <div className="popped-result-open relative overflow-hidden rounded-[1.75rem] border border-[var(--popped-border-strong)] bg-[var(--popped-surface)] p-4 shadow-popped sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--popped-iridescent-a),var(--popped-iridescent-b),transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-[radial-gradient(circle,var(--popped-iridescent-a),transparent_62%)] opacity-60 blur-2xl"
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#6f6a61]">
              POPPED #{result.puzzleNumber ?? "test"}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-[#111111] px-3 py-1.5 text-sm font-black text-[#fffdf8]">
              {result.resultLabel}
            </p>
          </div>
          <button
            className="min-h-11 rounded-full border border-[var(--popped-border)] bg-white/55 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6f6a61] transition hover:border-[var(--popped-border-strong)] hover:text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 focus:ring-offset-[#fffdf8]"
            onClick={toggleSpoiler}
            type="button"
          >
            {showSpoiler ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-[var(--popped-border)] bg-[#f8f4ec]/80 p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <ResultStat label="Guesses" value={result.totalGuesses.toString()} />
            <ResultStat label="Repeats" value={result.totalRepeatsUsed.toString()} />
            <ResultStat
              label="Stage"
              value={result.solvedStage ? result.solvedStage.toString() : "-"}
            />
          </div>
        </div>

        {showSpoiler ? (
          <div className="mt-5 grid grid-cols-[6.75rem_1fr] gap-4">
            <div
              aria-label={`${puzzle.songTitleEnglish} album art`}
              className="popped-album-reveal grid aspect-square place-items-center overflow-hidden rounded-[1.35rem] border border-black/10 bg-[radial-gradient(circle_at_30%_20%,var(--popped-iridescent-a),transparent_30%),linear-gradient(135deg,#111111,#6f6a61_56%,#fffdf8)] bg-cover bg-center p-3 text-center text-xs font-black uppercase tracking-[0.18em] text-[#fffdf8] shadow-[0_18px_40px_rgba(17,17,17,0.18)]"
              role="img"
              style={
                puzzle.albumArtUrl
                  ? { backgroundImage: `url(${puzzle.albumArtUrl})` }
                  : undefined
              }
            >
              {puzzle.albumArtUrl ? null : "Album Art"}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#111111]">
                {puzzle.songTitleEnglish}
              </p>
              {puzzle.songTitleKorean ? (
                <p className="text-base font-bold text-[#6f6a61]">
                  {puzzle.songTitleKorean}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-semibold text-[#6f6a61]">
                {puzzle.artistName}
              </p>
            </div>
          </div>
        ) : (
          <div className="popped-spoiler-settle mt-5 grid gap-4 rounded-[1.35rem] border border-dashed border-[var(--popped-border-strong)] bg-[#f8f4ec]/70 p-4 sm:grid-cols-[6.75rem_1fr] sm:items-center">
            <div
              aria-hidden="true"
              className="mx-auto grid size-28 place-items-center rounded-[1.25rem] border border-[var(--popped-border)] bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.86),transparent_26%),radial-gradient(circle_at_70%_70%,var(--popped-iridescent-c),transparent_36%),#fffdf8] sm:mx-0 sm:size-auto sm:aspect-square"
            >
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-[#111111]/25" />
                <span className="size-2 rounded-full bg-[#111111]/40" />
                <span className="size-2 rounded-full bg-[#111111]/25" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6a61]">
                Spoiler hidden
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6a61]">
                Title, artist, Korean title, and album art are tucked away for
                sharing.
              </p>
            </div>
          </div>
        )}
      </div>

      <RevealPreviewControls
        audioMessage={audioMessage}
        onPlayRevealPreview={onPlayRevealPreview}
        persistenceMessage={persistenceMessage}
        playback={playback}
      />

      <ShareResultButton result={result} />
    </section>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--popped-border)] bg-white/60 px-2.5 py-3">
      <p className="font-mono text-2xl font-black tabular-nums text-[#111111]">
        {value}
      </p>
      <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#6f6a61]">
        {label}
      </p>
    </div>
  );
}

function RevealPreviewControls({
  audioMessage,
  onPlayRevealPreview,
  persistenceMessage,
  playback,
}: {
  audioMessage: string | null;
  onPlayRevealPreview: () => void;
  persistenceMessage: string | null;
  playback: PlaybackState;
}) {
  const revealActive = playback.mode === "reveal";
  const buttonLabel =
    revealActive && playback.status === "playing"
      ? "Restart Preview"
      : revealActive && playback.status === "loading"
        ? "Loading Preview"
        : "Play Preview";

  return (
    <div className="rounded-[1.75rem] border border-[#201813]/10 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5f3b]">
            Reveal preview
          </p>
          <p className="mt-2 text-sm font-semibold text-[#5f5148]">
            {revealActive ? playback.message : "Play from the puzzle timestamp."}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${getPlaybackBadgeClass(
            revealActive ? playback.status : "idle",
          )}`}
        >
          {revealActive ? playback.status : "ready"}
        </span>
      </div>

      {audioMessage ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl bg-[#ffe7da] px-4 py-3 text-sm font-bold text-[#8b321d]"
        >
          {audioMessage}
        </p>
      ) : null}

      {persistenceMessage ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-2xl bg-[#fff0c7] px-4 py-3 text-sm font-bold text-[#745014]"
        >
          {persistenceMessage}
        </p>
      ) : null}

      <button
        className={`${secondaryButtonClass} mt-4 w-full`}
        disabled={revealActive && playback.status === "loading"}
        onClick={onPlayRevealPreview}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf1] px-2.5 py-3 shadow-inner shadow-[#201813]/5">
      <p className="font-mono text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#8a5f3b]">
        {label}
      </p>
    </div>
  );
}

function ShareResultButton({ result }: { result: GameResult }) {
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copied" | "shared" | "failed"
  >("idle");
  const shareText = createShareText(result);

  async function shareResult() {
    setShareStatus("idle");

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
          title: `POPPED #${result.puzzleNumber}`,
        });
        setShareStatus("shared");
        trackResultShared(result, "web_share");
        return;
      }

      await copyTextToClipboard(shareText);
      setShareStatus("copied");
      trackResultShared(result, "clipboard");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus("idle");
        return;
      }

      try {
        await copyTextToClipboard(shareText);
        setShareStatus("copied");
        trackResultShared(result, "clipboard_after_share_error");
      } catch {
        setShareStatus("failed");
      }
    }
  }

  return (
    <div className="space-y-2">
      <button className={primaryButtonClass} onClick={shareResult} type="button">
        Share result
      </button>
      <p
        aria-live="polite"
        className="min-h-5 text-center text-sm font-bold text-[#8a5f3b]"
      >
        {shareStatus === "shared" ? "Shared" : null}
        {shareStatus === "copied" ? "Copied" : null}
        {shareStatus === "failed" ? "Copy failed. Try again." : null}
      </p>
    </div>
  );
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard fallback failed");
  }
}

function createGameResult(result: Omit<GameResult, "resultLabel">): GameResult {
  const labelInput = { ...result, resultLabel: "" } satisfies GameResult;

  return {
    ...result,
    resultLabel: getResultLabel(labelInput),
  };
}

function trackPlaybackStarted({
  durationSeconds,
  mode,
  puzzleNumber,
  stage,
}: {
  durationSeconds?: number;
  mode: PlaybackMode;
  puzzleNumber: number;
  stage?: StageNumber;
}) {
  if (mode === "reveal") {
    trackAnalyticsEvent("reveal_preview_played", {
      puzzleNumber,
    });
    return;
  }

  trackAnalyticsEvent("stage_played", {
    durationSeconds: durationSeconds ?? null,
    mode,
    puzzleNumber,
    stage: stage ?? null,
  });
}

function trackResultShared(
  result: GameResult,
  method: "clipboard" | "clipboard_after_share_error" | "web_share",
) {
  trackAnalyticsEvent("result_shared", {
    method,
    puzzleNumber: result.puzzleNumber,
    solved: result.solved,
    stage: result.solvedStage ?? null,
  });
}

function getLoadingPlaybackMessage(mode: PlaybackMode, stage?: StageNumber) {
  if (mode === "reveal") {
    return "Loading reveal preview.";
  }

  return `Loading ${mode === "repeat" ? "repeat for " : ""}Stage ${stage}.`;
}

function getPlayingPlaybackMessage(mode: PlaybackMode, stage?: StageNumber) {
  if (mode === "reveal") {
    return "Playing reveal preview.";
  }

  return `Playing ${mode === "repeat" ? "repeat for " : ""}Stage ${stage}.`;
}

function getFinishedPlaybackMessage({
  mode,
  stage,
}: {
  mode: PlaybackMode;
  stage?: StageNumber;
}) {
  if (mode === "reveal") {
    return "Reveal preview finished.";
  }

  return `Stage ${stage} finished.`;
}

function getAutoplayBlockedMessage(mode: PlaybackMode) {
  if (mode === "reveal") {
    return "Tap Play Preview to hear the reveal.";
  }

  if (mode === "repeat") {
    return "Audio was blocked. Keep guessing or move to the next clue.";
  }

  return "Audio was blocked. Tap Repeat to hear this stage, or move to the next clue.";
}

function getPlaybackBadgeClass(status: PlaybackStatus) {
  if (status === "playing") {
    return "bg-[#d6f5d6] text-[#225322]";
  }

  if (status === "loading") {
    return "bg-[#f1dfca] text-[#8a5f3b]";
  }

  if (status === "blocked" || status === "error") {
    return "bg-[#ffe7da] text-[#8b321d]";
  }

  return "bg-[#201813]/10 text-[#5f5148]";
}

function formatDuration(duration: number): string {
  return duration.toFixed(1);
}

const primaryButtonClass =
  "h-16 w-full touch-manipulation rounded-full bg-[#201813] px-6 text-base font-black text-[#fffaf1] shadow-lg shadow-[#201813]/15 transition active:translate-y-0.5 hover:-translate-y-0.5 hover:bg-[#3a2a20] focus:outline-none focus:ring-2 focus:ring-[#b05f3c] focus:ring-offset-2 focus:ring-offset-[#fffaf1]";

const secondaryButtonClass =
  "h-14 touch-manipulation rounded-full border border-[#201813]/15 bg-white/80 px-4 text-sm font-black text-[#201813] transition active:translate-y-0.5 hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#b05f3c] focus:ring-offset-2 focus:ring-offset-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";
