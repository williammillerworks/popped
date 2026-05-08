import type { GameResult } from "../types/game";
import { getResultLabel } from "./scoring";

const DEFAULT_SHARE_URL = "popped.example.com";

export function createShareText(result: GameResult): string {
  const resultLabel = result.resultLabel || getResultLabel(result);
  const performanceLine =
    result.solved && result.solvedClipDuration !== undefined
      ? `🎧 Solved in ${formatDuration(result.solvedClipDuration)}`
      : "🎧 Missed today's song";

  return [
    `POPPED #${result.puzzleNumber}`,
    performanceLine,
    `🔁 ${formatCount(result.totalRepeatsUsed, "repeat")}`,
    `💬 ${formatCount(result.totalGuesses, "guess", "guesses")}`,
    `🏷 ${resultLabel}`,
    "",
    getShareUrl(),
  ].join("\n");
}

function getShareUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SHARE_URL;
}

function formatDuration(duration: number): string {
  return `${duration.toFixed(1)}s`;
}

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
