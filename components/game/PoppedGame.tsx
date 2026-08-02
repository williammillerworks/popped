"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  STAGE_DURATIONS_SECONDS,
  TOTAL_STAGES,
  type StageNumber,
} from "../../config/game";
import {
  compactNormalizeAnswer,
  isCorrectGuess,
  normalizeAnswer,
} from "../../lib/answerMatching";
import {
  clearStoredSession,
  getActiveStoredSessionValue,
  getStoredResultHistoryValue,
  getStoredSessionValue,
  getStoredResultValue,
  parseActiveStoredSession,
  parseStoredResultHistory,
  parseStoredSession,
  parseStoredResult,
  saveStoredResult,
  saveStoredSession,
  subscribeToStoredResultChanges,
} from "../../lib/resultPersistence";
import { isAutoplayBlocked, seekAudio } from "../../lib/audioPlayback";
import { trackAnalyticsEvent } from "../../lib/analytics";
import { getResultPresentation } from "../../lib/result-presentation";
import { getResultLabel } from "../../lib/scoring";
import type { TodayPuzzleResponse } from "../../lib/puzzles";
import type { GameResult, GameSession } from "../../types/game";
import { ArrivalScreen, ResolvedArrivalScreen } from "./ArrivalScreen";
import { CompletedGameplayScreen } from "./completed-gameplay-screen";
import {
  GameplayScreen,
  type GuessFeedback,
  type GuessFeedbackKind,
} from "./gameplay-screen";
import { ResultScreen } from "./result-screen";

type GameState =
  | "pre-start"
  | "continue"
  | "countdown"
  | "active"
  | "solved"
  | "failed";
type PlaybackMode = "stage" | "repeat" | "reveal";
type PlaybackStatus =
  | "idle"
  | "loading"
  | "paused"
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

type PendingEntryAction = "continue" | "start";
type ResultOrigin = "arrival" | "completed-gameplay" | "direct";
type CountdownPlayback = {
  mode: Extract<PlaybackMode, "stage">;
  stage: StageNumber;
};

const COUNTDOWN_STEP_MS = 1_000;
const FEEDBACK_HOLD_MS = 900;
const FEEDBACK_EXIT_MS = 180;
const OVERLAY_VISUAL_TAIL_MS = 240;
const OVERLAY_EXIT_MS = 220;
const VIEW_EXIT_MS = 140;
const GAMEPLAY_BUFFER_SAFETY_SECONDS = 0.5;
const BUFFER_RANGE_TOLERANCE_SECONDS = 0.05;
const ENTRY_GESTURE_FALLBACK_MS = 700;

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

function getServerStoredResultHistoryValue() {
  return "[]";
}

function getPlayableStageDurations(stageDurations: number[]) {
  if (
    stageDurations.length === TOTAL_STAGES &&
    stageDurations.every(
      (duration, index) =>
        Number.isFinite(duration) &&
        duration > 0 &&
        duration <= 5 &&
        (index === 0 || duration > stageDurations[index - 1]),
    )
  ) {
    return [...stageDurations];
  }

  return [...STAGE_DURATIONS_SECONDS];
}

function selectArrivalPuzzle(
  puzzle: TodayPuzzleResponse | null,
  previousPuzzle: TodayPuzzleResponse | null,
) {
  if (
    puzzle &&
    (parseStoredResult(getStoredResultValue(puzzle.id)) ||
      parseStoredSession(getStoredSessionValue(puzzle.id)))
  ) {
    return puzzle;
  }

  const activeSession = parseActiveStoredSession(getActiveStoredSessionValue());

  if (
    previousPuzzle &&
    activeSession?.puzzleId === previousPuzzle.id &&
    activeSession.puzzleDate === previousPuzzle.date &&
    parseStoredSession(getStoredSessionValue(previousPuzzle.id))
  ) {
    return previousPuzzle;
  }

  return puzzle;
}

type PoppedGameProps = {
  date: string;
  previousPuzzle?: TodayPuzzleResponse | null;
  puzzle: TodayPuzzleResponse | null;
};

export function PoppedGame({
  date,
  previousPuzzle = null,
  puzzle,
}: PoppedGameProps) {
  const hasHydrated = useSyncExternalStore(
    subscribeToStoredResultChanges,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  const selectedPuzzle = hasHydrated
    ? selectArrivalPuzzle(puzzle, previousPuzzle)
    : (puzzle ?? previousPuzzle);

  if (!selectedPuzzle) {
    return <ResolvedArrivalScreen date={date} variant="missing" />;
  }

  return <PoppedGameSession key={selectedPuzzle.id} puzzle={selectedPuzzle} />;
}

function PoppedGameSession({ puzzle }: { puzzle: TodayPuzzleResponse }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activePlayIdRef = useRef(0);
  const stopIntervalRef = useRef<number | null>(null);
  const hasRestoredStoredSessionRef = useRef(false);
  const hasEnteredGameplayRef = useRef(false);
  const isPrimingAudioRef = useRef(false);
  const primingMutedStateRef = useRef(false);
  const feedbackExitTimerRef = useRef<number | null>(null);
  const feedbackClearTimerRef = useRef<number | null>(null);
  const feedbackCompletionRef = useRef<(() => void) | null>(null);
  const viewExitTimerRef = useRef<number | null>(null);
  const isViewTransitioningRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>("pre-start");
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownPlayback, setCountdownPlayback] =
    useState<CountdownPlayback>({ mode: "stage", stage: 1 });
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [totalRepeatsUsed, setTotalRepeatsUsed] = useState(0);
  const [hasUsedRepeat, setHasUsedRepeat] = useState(false);
  const [feedback, setFeedback] = useState<GuessFeedback | null>(null);
  const [isPreparingResult, setIsPreparingResult] = useState(false);
  const [isViewExiting, setIsViewExiting] = useState(false);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(
    null,
  );
  const [solvedStage, setSolvedStage] = useState<StageNumber | null>(null);
  const [showSpoiler, setShowSpoiler] = useState(true);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);
  const [hasPreparedAudio, setHasPreparedAudio] = useState(false);
  const [hasBufferedGameplayAudio, setHasBufferedGameplayAudio] =
    useState(false);
  const [canRequestEntryBeforeBuffer, setCanRequestEntryBeforeBuffer] =
    useState(false);
  const [pendingEntryAction, setPendingEntryAction] =
    useState<PendingEntryAction | null>(null);
  const [hasOpenedStoredResult, setHasOpenedStoredResult] = useState(false);
  const [hasReturnedToCompletedArrival, setHasReturnedToCompletedArrival] =
    useState(false);
  const [resultOrigin, setResultOrigin] = useState<ResultOrigin>("direct");
  const [showCompletedGameplay, setShowCompletedGameplay] = useState(false);
  const [initialAudioLoadError, setInitialAudioLoadError] = useState(false);
  const [hasCompletedInitialLoading, setHasCompletedInitialLoading] =
    useState(false);
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
  const storedResultHistoryValue = useSyncExternalStore(
    subscribeToStoredResultChanges,
    getStoredResultHistoryValue,
    getServerStoredResultHistoryValue,
  );
  const storedResult = useMemo(
    () => parseStoredResult(storedResultValue),
    [storedResultValue],
  );
  const storedSession = useMemo(
    () => parseStoredSession(storedSessionValue),
    [storedSessionValue],
  );
  const storedResultHistory = useMemo(
    () => parseStoredResultHistory(storedResultHistoryValue),
    [storedResultHistoryValue],
  );
  const stageDurations = useMemo(
    () =>
      getPlayableStageDurations(
        storedSession?.stageDurations ?? puzzle.stageDurations,
      ),
    [puzzle.stageDurations, storedSession?.stageDurations],
  );
  const totalGuesses = guesses.length;
  const longestStageDuration = Math.max(...stageDurations);
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
          hasUsedRepeat,
        })
      : null;
  const persistedResult = completedResult ?? storedResult;
  const displayedMissCount =
    feedback?.kind === "wrong" ? Math.max(0, totalGuesses - 1) : totalGuesses;
  const result =
    feedback?.kind === "correct" || isPreparingResult || showCompletedGameplay
      ? null
      : completedResult ??
        (hasOpenedStoredResult ? storedResult : null) ??
        liveResult;
  const resultPresentation = useMemo(
    () => (result ? getResultPresentation(result, storedResultHistory) : null),
    [result, storedResultHistory],
  );

  function clearStopInterval() {
    if (stopIntervalRef.current !== null) {
      window.clearInterval(stopIntervalRef.current);
      stopIntervalRef.current = null;
    }
  }

  function clearFeedbackTimers() {
    if (feedbackExitTimerRef.current !== null) {
      window.clearTimeout(feedbackExitTimerRef.current);
      feedbackExitTimerRef.current = null;
    }

    if (feedbackClearTimerRef.current !== null) {
      window.clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }

    feedbackCompletionRef.current = null;
  }

  useEffect(() => {
    const audio = new Audio(puzzle.previewUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    function stopAudioPriming() {
      if (!isPrimingAudioRef.current) {
        return;
      }

      audio.pause();
      audio.muted = primingMutedStateRef.current;
      isPrimingAudioRef.current = false;

      try {
        audio.currentTime = puzzle.previewStartSeconds;
      } catch {
        // The next explicit play seeks again once the media is ready.
      }
    }

    function checkGameplayBuffer() {
      if (
        !Number.isFinite(audio.duration) ||
        audio.duration + BUFFER_RANGE_TOLERANCE_SECONDS <
          puzzle.previewStartSeconds + longestStageDuration
      ) {
        return;
      }

      const requiredBufferEnd = Math.min(
        puzzle.previewStartSeconds +
          longestStageDuration +
          GAMEPLAY_BUFFER_SAFETY_SECONDS,
        audio.duration,
      );

      if (
        !hasBufferedRange(
          audio.buffered,
          puzzle.previewStartSeconds,
          requiredBufferEnd,
        )
      ) {
        return;
      }

      stopAudioPriming();
      setHasBufferedGameplayAudio(true);
    }

    function handleLoadedMetadata() {
      setHasPreparedAudio(true);

      if (
        audio.duration + BUFFER_RANGE_TOLERANCE_SECONDS <
        puzzle.previewStartSeconds + longestStageDuration
      ) {
        handleAudioFailure("clip_too_short");
        return;
      }

      try {
        audio.currentTime = puzzle.previewStartSeconds;
      } catch {
        // Some browsers defer seeking until more media data is available.
      }

      checkGameplayBuffer();
    }

    function handleAudioFailure(reason: "clip_too_short" | "load_failed") {
      clearStopInterval();
      stopAudioPriming();
      setHasPreparedAudio(true);
      const message = hasEnteredGameplayRef.current
        ? "Audio couldn't play. Please try again."
        : "Audio could not load. Please try again.";
      trackAnalyticsEvent("audio_error", {
        puzzleNumber: puzzle.puzzleNumber,
        reason,
      });
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        status: "error",
        message,
      }));
      setAudioMessage(message);

      if (hasEnteredGameplayRef.current) {
        return;
      }

      setInitialAudioLoadError(true);
    }

    function handleError() {
      handleAudioFailure("load_failed");
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
    audio.addEventListener("canplay", checkGameplayBuffer);
    audio.addEventListener("canplaythrough", checkGameplayBuffer);
    audio.addEventListener("durationchange", checkGameplayBuffer);
    audio.addEventListener("loadeddata", checkGameplayBuffer);
    audio.addEventListener("progress", checkGameplayBuffer);
    audio.addEventListener("seeked", checkGameplayBuffer);
    audio.addEventListener("timeupdate", checkGameplayBuffer);
    audio.load();

    const readyStateTimer = window.setTimeout(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setHasPreparedAudio(true);
        checkGameplayBuffer();
      }
    }, 0);

    return () => {
      window.clearTimeout(readyStateTimer);
      clearStopInterval();
      stopAudioPriming();
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", checkGameplayBuffer);
      audio.removeEventListener("canplaythrough", checkGameplayBuffer);
      audio.removeEventListener("durationchange", checkGameplayBuffer);
      audio.removeEventListener("loadeddata", checkGameplayBuffer);
      audio.removeEventListener("progress", checkGameplayBuffer);
      audio.removeEventListener("seeked", checkGameplayBuffer);
      audio.removeEventListener("timeupdate", checkGameplayBuffer);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [
    longestStageDuration,
    puzzle.previewStartSeconds,
    puzzle.previewUrl,
    puzzle.puzzleNumber,
  ]);

  useEffect(() => {
    if (hasBufferedGameplayAudio) {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setCanRequestEntryBeforeBuffer(true);
    }, ENTRY_GESTURE_FALLBACK_MS);

    return () => window.clearTimeout(fallbackTimer);
  }, [hasBufferedGameplayAudio]);

  useEffect(() => {
    return () => {
      clearFeedbackTimers();

      if (viewExitTimerRef.current !== null) {
        window.clearTimeout(viewExitTimerRef.current);
      }
    };
  }, []);

  function transitionToView(commitTransition: () => void) {
    if (isViewTransitioningRef.current) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commitTransition();
      return;
    }

    isViewTransitioningRef.current = true;
    setIsViewExiting(true);
    viewExitTimerRef.current = window.setTimeout(() => {
      viewExitTimerRef.current = null;
      isViewTransitioningRef.current = false;
      setIsViewExiting(false);
      commitTransition();
    }, VIEW_EXIT_MS);
  }

  function requestGameEntryWithTransition(action: PendingEntryAction) {
    primeAudioForMobile();
    requestGameEntry(action);
  }

  useEffect(() => {
    if (
      !hasCheckedStoredResult ||
      persistedResult ||
      hasRestoredStoredSessionRef.current
    ) {
      return;
    }

    if (!storedSession) {
      hasRestoredStoredSessionRef.current = true;
      return;
    }

    const restoreTimer = window.setTimeout(() => {
      const restoredGuesses = getUniqueGuesses(storedSession.guesses);

      hasRestoredStoredSessionRef.current = true;
      setGameState("continue");
      setCountdownValue(3);
      setCurrentStage(storedSession.currentStage);
      setGuess("");
      setGuesses(restoredGuesses);
      setTotalRepeatsUsed(storedSession.totalRepeatsUsed);
      setHasUsedRepeat(storedSession.hasUsedRepeat);
      setFeedback(null);
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

      if (restoredGuesses.length !== storedSession.guesses.length) {
        saveStoredSession({
          ...storedSession,
          guesses: restoredGuesses,
        });
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [
    hasCheckedStoredResult,
    persistedResult,
    stageDurations,
    storedSession,
  ]);

  function requestGameEntry(action: PendingEntryAction) {
    const audio = audioRef.current;
    const audioIsReady =
      hasBufferedGameplayAudio ||
      (audio !== null &&
        isGameplayAudioBuffered(
          audio,
          puzzle.previewStartSeconds,
          longestStageDuration,
        ));

    if (audioIsReady) {
      setHasBufferedGameplayAudio(true);
      if (action === "start") {
        startGame();
      } else {
        continueGame();
      }
      return;
    }

    setPendingEntryAction(action);
    primeAudioForGameplayBuffer();
  }

  function startGame() {
    if (persistedResult) {
      return;
    }

    const nextStartedAt = new Date().toISOString();

    stopCurrentPlayback();
    hasEnteredGameplayRef.current = true;
    activePlayIdRef.current = 0;
    setCountdownPlayback({ mode: "stage", stage: 1 });
    setGameState("countdown");
    setCountdownValue(3);
    setCurrentStage(1);
    setGuess("");
    setGuesses([]);
    setStartedAt(nextStartedAt);
    setTotalRepeatsUsed(0);
    setHasUsedRepeat(false);
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
      totalRepeatsUsed: 0,
      hasUsedRepeat: false,
      startedAt: nextStartedAt,
    });
    primeAudioForMobile();
  }

  function continueGame() {
    stopCurrentPlayback();
    hasEnteredGameplayRef.current = true;
    setGameState("active");
    setGuess("");
    setFeedback(null);
    setAudioMessage(null);
    setPlayback({
      durationSeconds: stageDurations[currentStage - 1],
      mode: "stage",
      playId: activePlayIdRef.current,
      stage: currentStage,
      status: "idle",
      message: `Stage ${currentStage} ready.`,
    });
  }

  function submitGuess() {
    if (feedback) {
      return;
    }

    const trimmedGuess = guess.trim();

    if (!trimmedGuess) {
      showGuessFeedback("empty");
      return;
    }

    if (
      isCorrectGuess(trimmedGuess, [
        puzzle.canonicalAnswerEnglish,
        puzzle.canonicalAnswerKorean ?? "",
        ...puzzle.acceptedAnswers,
      ])
    ) {
      const nextGuessNumber = guesses.length + 1;
      const completedGameResult = createGameResult({
        completedAt: new Date().toISOString(),
        puzzleId: puzzle.id,
        puzzleDate: puzzle.date,
        puzzleNumber: puzzle.puzzleNumber,
        solved: true,
        solvedStage: currentStage,
        solvedClipDuration: stageDurations[currentStage - 1],
        totalGuesses: nextGuessNumber,
        totalRepeatsUsed,
        hasUsedRepeat,
        showSpoiler: true,
      });

      trackAnalyticsEvent("guess_correct", {
        guessNumber: nextGuessNumber,
        puzzleNumber: puzzle.puzzleNumber,
        stage: currentStage,
      });
      trackAnalyticsEvent("guess_submitted", {
        guessNumber: nextGuessNumber,
        puzzleNumber: puzzle.puzzleNumber,
        stage: currentStage,
      });
      setSolvedStage(currentStage);
      setCompletedResult(completedGameResult);
      setResultOrigin("direct");
      setShowSpoiler(true);
      saveCompletedResult(completedGameResult);
      showGuessFeedback("correct", () => {
        setIsPreparingResult(true);
        transitionToView(() => {
          setGameState("solved");
          setIsPreparingResult(false);
          void playRevealPreview();
        });
      });
      return;
    }

    if (guesses.some((previousGuess) => areEquivalentGuesses(trimmedGuess, previousGuess))) {
      showGuessFeedback("duplicate", () => setGuess(""));
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
    showGuessFeedback("wrong", () => setGuess(""));
  }

  function useRepeat() {
    if (feedback) {
      return;
    }

    const nextRepeatCount = totalRepeatsUsed + 1;

    stopCurrentPlayback();
    setTotalRepeatsUsed(nextRepeatCount);
    setHasUsedRepeat(true);
    persistGameSession({
      totalRepeatsUsed: nextRepeatCount,
      hasUsedRepeat: true,
    });
    setFeedback(null);
    trackAnalyticsEvent("repeat_used", {
      puzzleNumber: puzzle.puzzleNumber,
      repeatCount: nextRepeatCount,
      stage: currentStage,
    });
    void playStage(currentStage, "repeat");
  }

  function goToNextClue() {
    if (feedback) {
      return;
    }

    if (currentStage === TOTAL_STAGES) {
      const completedGameResult = createGameResult({
        completedAt: new Date().toISOString(),
        puzzleId: puzzle.id,
        puzzleDate: puzzle.date,
        puzzleNumber: puzzle.puzzleNumber,
        solved: false,
        totalGuesses,
        totalRepeatsUsed,
        hasUsedRepeat,
        showSpoiler: true,
      });

      setResultOrigin("direct");
      setShowSpoiler(true);
      setFeedback(null);
      trackAnalyticsEvent("answer_revealed", {
        guessCount: totalGuesses,
        puzzleNumber: puzzle.puzzleNumber,
        repeatCount: totalRepeatsUsed,
      });
      saveCompletedResult(completedGameResult);
      void playRevealPreview();
      setCompletedResult(completedGameResult);
      setIsPreparingResult(true);
      transitionToView(() => {
        setGameState("failed");
        setIsPreparingResult(false);
      });
      return;
    }

    const nextStage = (currentStage + 1) as StageNumber;

    trackAnalyticsEvent("next_clue_clicked", {
      fromStage: currentStage,
      puzzleNumber: puzzle.puzzleNumber,
      toStage: nextStage,
    });
    stopCurrentPlayback();
    setCurrentStage(nextStage);
    setGuess("");
    persistGameSession({
      currentStage: nextStage,
    });
    setCountdownPlayback({ mode: "stage", stage: nextStage });
    setCountdownValue(2);
    setGameState("countdown");
    setFeedback(null);
    primeAudioForMobile();
  }

  function showGuessFeedback(
    kind: GuessFeedbackKind,
    onComplete?: () => void,
  ) {
    clearFeedbackTimers();
    feedbackCompletionRef.current = onComplete ?? null;
    setFeedback({ kind, phase: "visible" });

    feedbackExitTimerRef.current = window.setTimeout(() => {
      setFeedback({ kind, phase: "exiting" });

      feedbackClearTimerRef.current = window.setTimeout(() => {
        const completion = feedbackCompletionRef.current;
        feedbackCompletionRef.current = null;
        setFeedback(null);
        completion?.();
      }, FEEDBACK_EXIT_MS);
    }, FEEDBACK_HOLD_MS);
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

  function toggleRevealPreviewPlayback() {
    if (playback.mode === "reveal" && playback.status === "playing") {
      pauseRevealPreview();
      return;
    }

    if (playback.mode === "reveal" && playback.status === "paused") {
      void resumeRevealPreview();
      return;
    }

    void playRevealPreview();
  }

  function pauseRevealPreview() {
    if (playback.mode !== "reveal" || playback.status !== "playing") {
      return;
    }

    activePlayIdRef.current += 1;
    clearStopInterval();
    audioRef.current?.pause();
    setPlayback((currentPlayback) => ({
      ...currentPlayback,
      status: "paused",
      message: "Reveal preview paused.",
    }));
  }

  async function resumeRevealPreview() {
    const audio = audioRef.current;

    if (!audio) {
      setAudioMessage("Audio is not ready yet. Please try again.");
      return;
    }

    const playId = activePlayIdRef.current + 1;
    activePlayIdRef.current = playId;
    setPlayback((currentPlayback) => ({
      ...currentPlayback,
      playId,
      status: "loading",
      message: "Loading reveal preview.",
    }));

    try {
      await audio.play();

      if (activePlayIdRef.current !== playId) {
        return;
      }

      setAudioMessage(null);
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        playId,
        status: "playing",
        message: "Playing reveal preview.",
      }));
      trackPlaybackStarted({
        mode: "reveal",
        puzzleNumber: puzzle.puzzleNumber,
      });
    } catch (error) {
      if (activePlayIdRef.current !== playId) {
        return;
      }

      const blocked = isAutoplayBlocked(error);
      const message = blocked
        ? getAutoplayBlockedMessage("reveal")
        : "Audio could not play. Please try again.";
      setAudioMessage(message);
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        playId,
        status: blocked ? "blocked" : "error",
        message,
      }));
      trackAnalyticsEvent("audio_error", {
        mode: "reveal",
        puzzleNumber: puzzle.puzzleNumber,
        reason: blocked ? "autoplay_blocked" : "play_failed",
        stage: null,
      });
    }
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
      const message =
        mode === "reveal"
          ? "Audio is not ready yet. Please try again."
          : "Audio couldn't play. Please try again.";
      setAudioMessage(message);
      setPlayback((currentPlayback) => ({
        ...currentPlayback,
        status: "error",
        message,
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

      setAudioMessage(null);
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
        : mode === "reveal"
          ? "Audio could not play. Please try again."
          : "Audio couldn't play. Please try again.";

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
    const nextVisible = !showSpoiler;
    const currentResult = completedResult ?? storedResult ?? liveResult;

    if (!nextVisible) {
      pauseRevealPreview();
    }

    setShowSpoiler(nextVisible);
    trackAnalyticsEvent(nextVisible ? "spoiler_shown" : "spoiler_hidden", {
      puzzleNumber: puzzle.puzzleNumber,
    });

    if (!currentResult) {
      return;
    }

    const updatedResult = {
      ...currentResult,
      showSpoiler: nextVisible,
    };

    if (completedResult) {
      setCompletedResult(updatedResult);
    }
    saveStoredResult(updatedResult);
  }

  function openCompletedResult() {
    if (!hasReturnedToCompletedArrival) {
      setShowSpoiler(storedResult?.showSpoiler ?? true);
    }

    setHasReturnedToCompletedArrival(false);
    setHasOpenedStoredResult(true);
    setResultOrigin("arrival");
    setShowCompletedGameplay(false);
  }

  function openResultFromCompletedGameplay() {
    setResultOrigin("completed-gameplay");
    setShowCompletedGameplay(false);
  }

  function returnFromResult() {
    stopCurrentPlayback();
    setPlayback((currentPlayback) =>
      currentPlayback.mode === "reveal"
        ? {
            ...currentPlayback,
            status: "paused",
            message: "Reveal preview paused.",
          }
        : currentPlayback,
    );

    if (resultOrigin !== "arrival") {
      setHasOpenedStoredResult(false);
      setShowCompletedGameplay(true);
      return;
    }

    setHasOpenedStoredResult(false);
    setHasReturnedToCompletedArrival(true);
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

  function primeAudioForGameplayBuffer() {
    const audio = audioRef.current;

    if (!audio || isPrimingAudioRef.current) {
      return;
    }

    isPrimingAudioRef.current = true;
    primingMutedStateRef.current = audio.muted;
    audio.muted = true;

    try {
      audio.currentTime = puzzle.previewStartSeconds;
    } catch {
      // play() will request the target range once media seeking is available.
    }

    void audio.play().catch(() => {
      if (!isPrimingAudioRef.current) {
        return;
      }

      audio.pause();
      audio.muted = primingMutedStateRef.current;
      isPrimingAudioRef.current = false;
      audio.load();
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

  function showPersistenceMessageIfNeeded(wasSaved: boolean) {
    setPersistenceMessage(
      wasSaved
        ? null
        : "Your result is shown here, but this browser blocked local saving. A refresh may start today again.",
    );
  }

  function persistGameSession(
    session: Partial<
      Pick<
        GameSession,
        "currentStage" | "guesses" | "hasUsedRepeat" | "totalRepeatsUsed"
      >
    > & {
      startedAt?: string;
    } = {},
  ) {
    if (persistedResult) {
      return;
    }

    const nextSession: GameSession = {
      puzzleId: puzzle.id,
      puzzleDate: puzzle.date,
      durationPresetId:
        storedSession?.durationPresetId ?? puzzle.durationPresetId,
      stageDurations,
      startedAt: session.startedAt ?? startedAt ?? new Date().toISOString(),
      currentStage: session.currentStage ?? currentStage,
      guesses: session.guesses ?? guesses,
      totalRepeatsUsed: session.totalRepeatsUsed ?? totalRepeatsUsed,
      hasUsedRepeat: session.hasUsedRepeat ?? hasUsedRepeat,
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

  const playCountdownStage = useEffectEvent(() => {
    setGameState("active");
    void playStage(countdownPlayback.stage, countdownPlayback.mode);
  });

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

  const hasCompletedInitialPreparation =
    hasCheckedStoredResult &&
    (initialAudioLoadError ||
      canRequestEntryBeforeBuffer ||
      (hasPreparedAudio && hasBufferedGameplayAudio));

  function renderView(
    viewKey: string,
    view: ReactNode,
    animateEntry = true,
  ) {
    return (
      <div
        className={`popped-view-transition ${
          animateEntry ? "popped-view-transition-enter" : ""
        } ${isViewExiting ? "popped-view-transition-exit" : ""}`}
        key={viewKey}
      >
        {view}
      </div>
    );
  }

  if (!hasCompletedInitialLoading) {
    return renderView(
      "initial-loading",
      <ArrivalScreen
        loadingComplete={hasCompletedInitialPreparation}
        onLoadingComplete={() => setHasCompletedInitialLoading(true)}
        variant="loading"
      />,
      false,
    );
  }

  if (pendingEntryAction) {
    return renderView(
      "entry-loading",
      <ArrivalScreen
        loadingComplete={hasBufferedGameplayAudio || initialAudioLoadError}
        onLoadingComplete={() => {
          if (initialAudioLoadError) {
            setPendingEntryAction(null);
            return;
          }

          setPendingEntryAction(null);

          if (pendingEntryAction === "start") {
            startGame();
          } else {
            continueGame();
          }
        }}
        variant="loading"
      />,
      false,
    );
  }

  if (initialAudioLoadError) {
    return renderView(
      "arrival-error",
      <ArrivalScreen
        date={puzzle.date}
        editorName={puzzle.editorName}
        errorMessage="Audio load failure"
        puzzleNumber={puzzle.puzzleNumber}
        variant="error"
      />,
      false,
    );
  }

  if (
    (hasReturnedToCompletedArrival && (persistedResult || liveResult)) ||
    (storedResult && !completedResult && !hasOpenedStoredResult)
  ) {
    return renderView(
      "arrival-completed",
      <ArrivalScreen
        date={puzzle.date}
        editorName={puzzle.editorName}
        onAction={() => transitionToView(openCompletedResult)}
        puzzleNumber={puzzle.puzzleNumber}
        variant="completed"
      />,
      false,
    );
  }

  if (showCompletedGameplay && persistedResult) {
    return renderView(
      "completed-gameplay",
      <CompletedGameplayScreen
        answer={puzzle.canonicalAnswerEnglish}
        onSeeResult={() => transitionToView(openResultFromCompletedGameplay)}
        result={persistedResult}
      />,
    );
  }

  if (result && resultPresentation) {
    return renderView(
      "result",
      <ResultScreen
        audioMessage={audioMessage}
        onBackToPuzzle={() => transitionToView(returnFromResult)}
        onPlayPausePreview={toggleRevealPreviewPlayback}
        onToggleSpoiler={toggleSpoilerVisibility}
        persistenceMessage={persistenceMessage}
        playbackStatus={playback.mode === "reveal" ? playback.status : "idle"}
        presentation={resultPresentation}
        puzzle={puzzle}
        result={result}
        showSpoiler={showSpoiler}
      />,
    );
  }

  if (gameState === "pre-start") {
    return renderView(
      "arrival-new",
      <ArrivalScreen
        date={puzzle.date}
        editorName={puzzle.editorName}
        onAction={() => requestGameEntryWithTransition("start")}
        puzzleNumber={puzzle.puzzleNumber}
        variant="new"
      />,
      false,
    );
  }

  if (gameState === "continue") {
    return renderView(
      "arrival-continue",
      <ArrivalScreen
        date={puzzle.date}
        editorName={puzzle.editorName}
        onAction={() => requestGameEntryWithTransition("continue")}
        puzzleNumber={puzzle.puzzleNumber}
        stage={currentStage}
        variant="continue"
      />,
      false,
    );
  }

  if (gameState === "countdown" || gameState === "active") {
    const overlayMode =
      gameState === "countdown"
        ? "countdown"
        : playback.mode !== "reveal" &&
            (playback.status === "loading" || playback.status === "playing")
          ? "playing"
          : null;

    return renderView(
      "gameplay",
      <GameplayScreen
        audioMessage={audioMessage}
        currentStage={currentStage}
        feedback={feedback}
        guess={guess}
        locked={Boolean(overlayMode) || isViewExiting}
        missCount={displayedMissCount}
        onGuessChange={setGuess}
        onNextClue={goToNextClue}
        onRepeat={useRepeat}
        onSubmit={submitGuess}
      >
        <GameplayAudioOverlayPresence
          countdownValue={countdownValue}
          countdownStage={countdownPlayback.stage}
          mode={overlayMode}
          playback={playback}
        />
      </GameplayScreen>,
      false,
    );
  }

  return null;
}

function GameplayAudioOverlayPresence({
  countdownStage,
  countdownValue,
  mode,
  playback,
}: {
  countdownStage: StageNumber;
  countdownValue?: number;
  mode: "countdown" | "playing" | null;
  playback: PlaybackState;
}) {
  const [retainedMode, setRetainedMode] = useState(mode);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (mode) {
      const retainFrame = window.requestAnimationFrame(() => {
        setRetainedMode(mode);
        setIsExiting(false);
      });

      return () => window.cancelAnimationFrame(retainFrame);
    }

    if (!retainedMode) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const clearFrame = window.requestAnimationFrame(() => {
        setIsExiting(false);
        setRetainedMode(null);
      });

      return () => window.cancelAnimationFrame(clearFrame);
    }

    const visualTailMs =
      retainedMode === "playing" && playback.status === "finished"
        ? OVERLAY_VISUAL_TAIL_MS
        : 0;
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, visualTailMs);
    const clearTimer = window.setTimeout(() => {
      setRetainedMode(null);
      setIsExiting(false);
    }, visualTailMs + OVERLAY_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(clearTimer);
    };
  }, [mode, playback.status, retainedMode]);

  const visibleMode = mode ?? retainedMode;

  if (!visibleMode) {
    return null;
  }

  return (
    <GameplayAudioOverlay
      countdownValue={countdownValue}
      countdownStage={countdownStage}
      exiting={isExiting}
      mode={visibleMode}
      playback={playback}
    />
  );
}

function GameplayAudioOverlay({
  countdownStage,
  countdownValue,
  exiting,
  mode,
  playback,
}: {
  countdownStage: StageNumber;
  countdownValue?: number;
  exiting: boolean;
  mode: "countdown" | "playing";
  playback: PlaybackState;
}) {
  const isPlaying = mode === "playing";
  const visualizerStyle = getPlaybackVisualizerStyle(playback);
  const statusLabel = isPlaying
    ? playback.status === "playing"
      ? `Playing Stage ${playback.stage ?? 1}`
      : `Preparing Stage ${playback.stage ?? 1}`
    : `Stage ${countdownStage} starts in ${countdownValue}`;

  return (
    <div
      aria-label={statusLabel}
      aria-live="polite"
      className={`popped-gameplay-overlay ${
        isPlaying ? "popped-gameplay-overlay-playing" : ""
      } ${exiting ? "popped-gameplay-overlay-exiting" : ""}`}
      role="status"
    >
      <div
        className={`popped-gameplay-orb ${
          isPlaying ? "popped-gameplay-orb-playing" : ""
        } ${
          isPlaying && playback.status === "loading"
            ? "popped-gameplay-orb-loading"
            : ""
        }`}
        style={visualizerStyle}
      >
        {countdownValue === undefined ? null : (
          <span
            aria-hidden={isPlaying}
            className={`popped-gameplay-count-layer ${
              isPlaying ? "popped-gameplay-count-layer-hidden" : ""
            }`}
          >
            <span className="popped-gameplay-count" key={countdownValue}>
              {countdownValue}
            </span>
          </span>
        )}
      </div>
    </div>
  );
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

  return "Audio didn't start. Tap Repeat.";
}

function areEquivalentGuesses(firstGuess: string, secondGuess: string) {
  return (
    normalizeAnswer(firstGuess) === normalizeAnswer(secondGuess) ||
    compactNormalizeAnswer(firstGuess) === compactNormalizeAnswer(secondGuess)
  );
}

function getUniqueGuesses(guesses: string[]) {
  return guesses.reduce<string[]>((uniqueGuesses, guess) => {
    if (
      uniqueGuesses.some((existingGuess) =>
        areEquivalentGuesses(guess, existingGuess),
      )
    ) {
      return uniqueGuesses;
    }

    return [...uniqueGuesses, guess];
  }, []);
}

function isGameplayAudioBuffered(
  audio: HTMLAudioElement,
  previewStartSeconds: number,
  longestStageDuration: number,
): boolean {
  if (
    !Number.isFinite(audio.duration) ||
    audio.duration + BUFFER_RANGE_TOLERANCE_SECONDS <
      previewStartSeconds + longestStageDuration
  ) {
    return false;
  }

  const requiredBufferEnd = Math.min(
    previewStartSeconds +
      longestStageDuration +
      GAMEPLAY_BUFFER_SAFETY_SECONDS,
    audio.duration,
  );

  return hasBufferedRange(
    audio.buffered,
    previewStartSeconds,
    requiredBufferEnd,
  );
}

function hasBufferedRange(
  buffered: TimeRanges,
  startSeconds: number,
  endSeconds: number,
): boolean {
  for (let index = 0; index < buffered.length; index += 1) {
    if (
      buffered.start(index) <= startSeconds + BUFFER_RANGE_TOLERANCE_SECONDS &&
      buffered.end(index) + BUFFER_RANGE_TOLERANCE_SECONDS >= endSeconds
    ) {
      return true;
    }
  }

  return false;
}

function getPlaybackVisualizerStyle(playback: PlaybackState): CSSProperties {
  const stage = playback.stage ?? 1;
  const modeOffset = playback.mode === "repeat" ? 5 : 0;
  const seed = stage + modeOffset;

  return {
    "--popped-visualizer-delay": `${-(seed % 4) * 0.37}s`,
    "--popped-visualizer-duration": `${2.8 + (seed % 3) * 0.32}s`,
    "--popped-visualizer-hue": `${(seed % 7) * 9}deg`,
    "--popped-visualizer-rotation-end": `${seed % 2 === 0 ? 5 : -5}deg`,
    "--popped-visualizer-rotation-mid": `${seed % 2 === 0 ? 2 : -2}deg`,
    "--popped-visualizer-rotation-start": `${seed % 2 === 0 ? -4 : 4}deg`,
    "--popped-visualizer-scale": `${1.018 + (seed % 3) * 0.006}`,
  } as CSSProperties;
}
