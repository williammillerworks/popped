"use client";

import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { TOTAL_STAGES } from "../../config/game";
import type { GameResult } from "../../types/game";
import styles from "./completed-gameplay-screen.module.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const TOAST_DURATION_MS = 1_580;

type CompletedGameplayScreenProps = {
  answer: string;
  onSeeResult: () => void;
  result: GameResult;
};

export function CompletedGameplayScreen({
  answer,
  onSeeResult,
  result,
}: CompletedGameplayScreenProps) {
  const toastTimerRef = useRef<number | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const completedStage = result.solved ? (result.solvedStage ?? 1) : TOTAL_STAGES;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showComingSoon() {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToastMessage("Coming soon");
    setToastKey((currentKey) => currentKey + 1);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }

  return (
    <main className={`${styles.shell} ${inter.className}`}>
      <section className={styles.screen}>
        <div className={styles.content}>
          <header className={styles.header}>
            <span aria-hidden="true" className={styles.morePlaceholder}>
              More <span className={styles.chevron} />
            </span>
          </header>

          <CompletedStageProgress
            completedStage={completedStage}
            solved={result.solved}
          />

          <div className={styles.answerArea}>
            <div aria-live="polite" className={styles.toastSlot}>
              {toastMessage ? (
                <span className={styles.toast} key={toastKey} role="status">
                  {toastMessage}
                </span>
              ) : null}
            </div>
            <strong className={styles.answer}>{answer}</strong>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={onSeeResult}
              type="button"
            >
              See result
            </button>
            <button
              className={styles.actionButton}
              onClick={showComingSoon}
              type="button"
            >
              Play the Popped archive
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CompletedStageProgress({
  completedStage,
  solved,
}: {
  completedStage: number;
  solved: boolean;
}) {
  return (
    <div className={styles.progressRow}>
      <strong className={styles.stageLabel}>
        {solved ? `Stage ${completedStage}` : "Last Stage"}
      </strong>
      <div
        aria-label={`Stage ${completedStage} of ${TOTAL_STAGES}`}
        aria-valuemax={TOTAL_STAGES}
        aria-valuemin={1}
        aria-valuenow={completedStage}
        className={styles.progressSegments}
        role="progressbar"
      >
        {Array.from({ length: TOTAL_STAGES }, (_, index) => (
          <span
            className={index < completedStage ? styles.progressComplete : ""}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
