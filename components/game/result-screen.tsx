"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { trackAnalyticsEvent } from "../../lib/analytics";
import { formatPuzzleDisplayDate } from "../../lib/dates";
import {
  formatOrdinal,
  formatRepeatCount,
  type ResultPresentation,
} from "../../lib/result-presentation";
import { createShareText } from "../../lib/share";
import type { TodayPuzzleResponse } from "../../lib/puzzles";
import type { GameResult } from "../../types/game";
import styles from "./result-screen.module.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const TOAST_DURATION_MS = 1_580;

export type ResultPreviewStatus =
  | "blocked"
  | "error"
  | "finished"
  | "idle"
  | "loading"
  | "paused"
  | "playing";

type ResultScreenProps = {
  audioMessage: string | null;
  onBackToPuzzle: () => void;
  onPlayPausePreview: () => void;
  onToggleSpoiler: () => void;
  persistenceMessage: string | null;
  playbackStatus: ResultPreviewStatus;
  presentation: ResultPresentation;
  puzzle: TodayPuzzleResponse;
  result: GameResult;
  showSpoiler: boolean;
};

const BADGE_ASSETS = {
  default: {
    alt: "Popped badge",
    height: 400,
    src: "/badge-default.png",
    width: 800,
  },
  genius: {
    alt: "Genius crown badge",
    height: 436,
    src: "/badge-genius.png",
    width: 436,
  },
  newcomer: {
    alt: "Newcomer first badge",
    height: 460,
    src: "/badge-newcomer.png",
    width: 444,
  },
} as const;

export function ResultScreen({
  audioMessage,
  onBackToPuzzle,
  onPlayPausePreview,
  onToggleSpoiler,
  persistenceMessage,
  playbackStatus,
  presentation,
  puzzle,
  result,
  showSpoiler,
}: ResultScreenProps) {
  const badgeAsset = BADGE_ASSETS[presentation.badge];
  const isPreviewPlaying = playbackStatus === "playing";
  const isPreviewLoading = playbackStatus === "loading";
  const toastTimerRef = useRef<number | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    setToastKey((currentKey) => currentKey + 1);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }

  return (
    <main className={`${styles.shell} ${inter.className}`}>
      <section className={styles.screen}>
        <header className={styles.header}>
          <button
            aria-label="Back to puzzle"
            className={styles.backButton}
            onClick={onBackToPuzzle}
            title="Back to puzzle"
            type="button"
          >
            <span aria-hidden="true" className={styles.backIcon} />
          </button>
        </header>

        <div aria-live="polite" className={styles.toastSlot}>
          {toastMessage ? (
            <span className={styles.toast} key={toastKey} role="status">
              {toastMessage}
            </span>
          ) : null}
        </div>

        <div className={styles.content}>
          <div className={styles.celebration}>
            <Image
              alt={badgeAsset.alt}
              className={`${styles.badge} ${styles[`badge-${presentation.badge}`]}`}
              height={badgeAsset.height}
              priority
              src={badgeAsset.src}
              width={badgeAsset.width}
            />
            <ResultMessage presentation={presentation} result={result} />
          </div>

          <ResultStatisticsRow presentation={presentation} />

          <div className={styles.bottomArea}>
            {audioMessage ? (
              <p aria-live="polite" className={styles.errorMessage}>
                {audioMessage}
              </p>
            ) : null}
            {persistenceMessage ? (
              <p aria-live="polite" className={styles.persistenceMessage}>
                {persistenceMessage}
              </p>
            ) : null}

            <div className={styles.player}>
              <SongArtwork puzzle={puzzle} showSpoiler={showSpoiler} />
              <SongDetails puzzle={puzzle} showSpoiler={showSpoiler} />
              <button
                aria-label={isPreviewPlaying ? "Pause preview" : "Play preview"}
                className={styles.audioButton}
                disabled={isPreviewLoading}
                onClick={onPlayPausePreview}
                title={isPreviewPlaying ? "Pause preview" : "Play preview"}
                type="button"
              >
                <span aria-hidden="true" className={styles.audioIconSwap}>
                  <span
                    className={`${styles.audioIcon} ${styles.playIcon} ${
                      isPreviewPlaying ? "" : styles.audioIconVisible
                    }`}
                  />
                  <span
                    className={`${styles.audioIcon} ${styles.pauseIcon} ${
                      isPreviewPlaying ? styles.audioIconVisible : ""
                    }`}
                  />
                </span>
              </button>
              <button
                className={styles.spoilerButton}
                onClick={onToggleSpoiler}
                type="button"
              >
                <span aria-hidden="true" className={styles.spoilerLabelSwap}>
                  <span
                    className={`${styles.spoilerLabel} ${
                      showSpoiler ? styles.spoilerLabelVisible : ""
                    }`}
                  >
                    Hide
                  </span>
                  <span
                    className={`${styles.spoilerLabel} ${
                      showSpoiler ? "" : styles.spoilerLabelVisible
                    }`}
                  >
                    Show
                  </span>
                </span>
                <span className={styles.srOnly}>
                  {showSpoiler ? "Hide song details" : "Show song details"}
                </span>
              </button>
            </div>

            <div className={styles.resultActions}>
              <ShareResultButton onFeedback={showToast} result={result} />
              <button
                className={styles.archiveButton}
                onClick={() => showToast("Coming soon")}
                type="button"
              >
                Play the archive
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultMessage({
  presentation,
  result,
}: {
  presentation: ResultPresentation;
  result: GameResult;
}) {
  if (presentation.badge === "newcomer") {
    return (
      <div className={styles.message}>
        <h1>Newcomer</h1>
        {result.solved && result.solvedStage ? (
          <SolvedResultCopy result={result} />
        ) : (
          <p>
            <strong>Congratulations</strong> on your first Popped
            <br />
            See you <strong>tomorrow!</strong>
          </p>
        )}
      </div>
    );
  }

  const title =
    presentation.badge === "genius"
      ? "Genius"
      : result.solved
        ? "Congratulations"
        : "Not Today";

  return (
    <div className={styles.message}>
      <h1>{title}</h1>
      {result.solved && result.solvedStage ? (
        <SolvedResultCopy result={result} />
      ) : (
        <p>The reveal preview starts from the puzzle timestamp.</p>
      )}
    </div>
  );
}

function SolvedResultCopy({ result }: { result: GameResult }) {
  return (
    <p>
      You found the song in{" "}
      <strong>{formatOrdinal(result.solvedStage ?? 1)} stage.</strong>
      <br />
      You used <strong>{formatRepeatCount(result.totalRepeatsUsed)}</strong>
    </p>
  );
}

function ResultStatisticsRow({
  presentation,
}: {
  presentation: ResultPresentation;
}) {
  const statistics = [
    [presentation.statistics.completed, "Completed"],
    [presentation.statistics.solvePercentage, "Solve %"],
    [presentation.statistics.streak, "Streak"],
  ] as const;

  return (
    <div className={styles.statistics}>
      {statistics.map(([value, label]) => (
        <div className={styles.statistic} key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function SongArtwork({
  puzzle,
  showSpoiler,
}: {
  puzzle: TodayPuzzleResponse;
  showSpoiler: boolean;
}) {
  const showsAlbumArt = Boolean(showSpoiler && puzzle.albumArtUrl);

  return (
    <div
      aria-label={
        showsAlbumArt ? `${puzzle.songTitleEnglish} album art` : undefined
      }
      aria-hidden={showsAlbumArt ? undefined : true}
      className={styles.artwork}
      role={showsAlbumArt ? "img" : undefined}
    >
      <span
        aria-hidden="true"
        className={`${styles.artworkLayer} ${styles.hiddenArtwork} ${
          showsAlbumArt ? "" : styles.artworkLayerVisible
        }`}
      />
      {puzzle.albumArtUrl ? (
        <span
          aria-hidden="true"
          className={`${styles.artworkLayer} ${styles.albumArtwork} ${
            showsAlbumArt ? styles.artworkLayerVisible : ""
          }`}
          style={{ backgroundImage: `url(${puzzle.albumArtUrl})` }}
        />
      ) : null}
    </div>
  );
}

function SongDetails({
  puzzle,
  showSpoiler,
}: {
  puzzle: TodayPuzzleResponse;
  showSpoiler: boolean;
}) {
  return (
    <div className={styles.songDetails}>
      <span
        aria-hidden={showSpoiler}
        className={`${styles.songDetailsLayer} ${
          showSpoiler ? "" : styles.songDetailsLayerVisible
        }`}
      >
        <strong>Artist Hidden</strong>
        <span>{formatPuzzleDisplayDate(puzzle.date)}</span>
      </span>
      <span
        aria-hidden={!showSpoiler}
        className={`${styles.songDetailsLayer} ${
          showSpoiler ? styles.songDetailsLayerVisible : ""
        }`}
      >
        <strong>{puzzle.songTitleEnglish}</strong>
        <span>{puzzle.artistName}</span>
      </span>
    </div>
  );
}

function ShareResultButton({
  onFeedback,
  result,
}: {
  onFeedback: (message: string) => void;
  result: GameResult;
}) {
  const shareText = createShareText(result);

  async function shareResult() {
    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
          title: `POPPED #${result.puzzleNumber}`,
        });
        onFeedback("Shared");
        trackResultShared(result, "web_share");
        return;
      }

      await copyTextToClipboard(shareText);
      onFeedback("Copied");
      trackResultShared(result, "clipboard");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await copyTextToClipboard(shareText);
        onFeedback("Copied");
        trackResultShared(result, "clipboard_after_share_error");
      } catch {
        onFeedback("Try Again");
      }
    }
  }

  return (
    <button
      aria-label="Share result"
      className={styles.shareButton}
      onClick={shareResult}
      title="Share result"
      type="button"
    >
      <span aria-hidden="true" className={styles.shareIcon}>
        <span />
      </span>
    </button>
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
