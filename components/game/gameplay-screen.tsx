"use client";

import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import { TOTAL_STAGES, type StageNumber } from "../../config/game";
import { EnglishKeyboard } from "./english-keyboard";
import styles from "./gameplay-screen.module.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const MAX_GUESS_FONT_SIZE = 28;
const MIN_GUESS_FONT_SIZE = 14;

export type GuessFeedbackKind =
  | "empty"
  | "wrong"
  | "duplicate"
  | "correct";

export type GuessFeedback = {
  kind: GuessFeedbackKind;
  phase: "visible" | "exiting";
};

type GameplayScreenProps = {
  audioMessage: string | null;
  children?: ReactNode;
  currentStage: StageNumber;
  feedback: GuessFeedback | null;
  guess: string;
  locked: boolean;
  missCount: number;
  onGuessChange: (value: string) => void;
  onNextClue: () => void;
  onRepeat: () => void;
  onSubmit: () => void;
};

export function GameplayScreen({
  audioMessage,
  children,
  currentStage,
  feedback,
  guess,
  locked,
  missCount,
  onGuessChange,
  onNextClue,
  onRepeat,
  onSubmit,
}: GameplayScreenProps) {
  const isCorrect = feedback?.kind === "correct";
  const controlsLocked = locked || feedback !== null;

  return (
    <main className={`${styles.shell} ${inter.className}`}>
      <section className={`${styles.screen} popped-gameplay-surface`}>
        <div className={styles.content}>
          <div
            aria-hidden={locked ? true : undefined}
            className={styles.underlay}
            inert={locked}
          >
            <header
              className={`${styles.header} popped-gameplay-entry-top`}
            >
              <span aria-hidden="true" className={styles.morePlaceholder}>
                More <span className={styles.chevron} />
              </span>
            </header>

            <StageProgress currentStage={currentStage} missCount={missCount} />

            <GuessArea
              audioMessage={audioMessage}
              feedback={feedback}
              guess={guess}
            />

            <div
              aria-hidden={isCorrect ? true : undefined}
              className={`${styles.actions} popped-gameplay-entry-lower ${
                isCorrect ? styles.actionsHidden : ""
              }`}
            >
              <button
                className={styles.actionButton}
                disabled={controlsLocked}
                onClick={onRepeat}
                type="button"
              >
                Repeat
              </button>
              <button
                className={styles.actionButton}
                disabled={controlsLocked}
                onClick={onNextClue}
                type="button"
              >
                {currentStage === TOTAL_STAGES
                  ? "Reveal Answer"
                  : "Next Clue"}
              </button>
            </div>

            <div
              className={`${styles.keyboardWrap} popped-gameplay-entry-lower`}
            >
              <EnglishKeyboard
                disabled={controlsLocked}
                onSubmit={onSubmit}
                onValueChange={onGuessChange}
                value={guess}
              />
            </div>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}

function StageProgress({
  currentStage,
  missCount,
}: {
  currentStage: StageNumber;
  missCount: number;
}) {
  return (
    <div className={`${styles.progressRow} popped-gameplay-entry-top`}>
      <strong className={styles.stageLabel}>
        {currentStage === TOTAL_STAGES ? "Last Stage" : `Stage ${currentStage}`}
      </strong>
      <div
        aria-label={`Stage ${currentStage} of ${TOTAL_STAGES}`}
        className={styles.progressSegments}
        role="progressbar"
        aria-valuemax={TOTAL_STAGES}
        aria-valuemin={1}
        aria-valuenow={currentStage}
      >
        {Array.from({ length: TOTAL_STAGES }, (_, index) => (
          <span
            className={index < currentStage ? styles.progressComplete : ""}
            key={index}
          />
        ))}
      </div>
      <span
        className={`${styles.missCount} ${
          missCount > 0 ? styles.missCountEntered : ""
        }`}
        key={`miss-${missCount}`}
      >
        {missCount > 0
          ? `${missCount} ${missCount === 1 ? "Miss" : "Misses"}`
          : null}
      </span>
    </div>
  );
}

function GuessArea({
  audioMessage,
  feedback,
  guess,
}: {
  audioMessage: string | null;
  feedback: GuessFeedback | null;
  guess: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [fontSize, setFontSize] = useState(MAX_GUESS_FONT_SIZE);
  const toastMessage = feedback ? getFeedbackMessage(feedback.kind) : audioMessage;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;

    if (!container || !measure || !guess) {
      setFontSize(MAX_GUESS_FONT_SIZE);
      return;
    }

    function fitGuess() {
      const availableWidth = Math.max(0, container!.clientWidth - 48);
      const measuredWidth = measure!.getBoundingClientRect().width;
      const nextFontSize =
        measuredWidth <= availableWidth || measuredWidth === 0
          ? MAX_GUESS_FONT_SIZE
          : Math.max(
              MIN_GUESS_FONT_SIZE,
              Math.floor(MAX_GUESS_FONT_SIZE * (availableWidth / measuredWidth)),
            );

      setFontSize(nextFontSize);
    }

    fitGuess();
    const resizeObserver = new ResizeObserver(fitGuess);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [guess]);

  return (
    <div className={`${styles.guessArea} popped-gameplay-entry-main`}>
      <div
        aria-live="polite"
        className={`${styles.toastSlot} ${
          feedback?.phase === "exiting" ? styles.toastExiting : ""
        }`}
      >
        {toastMessage ? (
          <span className={styles.toast} role="status">
            {toastMessage}
          </span>
        ) : null}
      </div>

      <div className={styles.guessLine} ref={containerRef}>
        <span
          className={`${styles.guessText} ${
            feedback?.kind === "correct" ? styles.correctGuess : ""
          }`}
          style={{ fontSize }}
        >
          {guess}
        </span>
        {feedback?.kind === "correct" ? null : (
          <span aria-hidden="true" className={styles.caret} />
        )}
        <span aria-hidden="true" className={styles.measureText} ref={measureRef}>
          {guess}
        </span>
      </div>
    </div>
  );
}

function getFeedbackMessage(kind: GuessFeedbackKind) {
  if (kind === "empty") {
    return "Guess Input";
  }

  if (kind === "wrong") {
    return "Try Again";
  }

  if (kind === "duplicate") {
    return "Already tried";
  }

  return "Correct!";
}
