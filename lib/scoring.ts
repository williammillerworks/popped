import type { GameResult } from "../types/game";

export function getResultLabel(result: GameResult): string {
  if (!result.solved) {
    return "Not Today";
  }

  if (
    result.solvedStage &&
    result.solvedStage <= 2 &&
    result.totalGuesses === 1
  ) {
    return "Intro Sharp";
  }

  if (result.totalGuesses === 1) {
    return "One Shot";
  }

  if (
    result.solvedClipDuration !== undefined &&
    result.solvedClipDuration <= 1.0
  ) {
    return "Fast Ear";
  }

  if (result.solvedStage === 7) {
    return "Still Got It";
  }

  if (result.totalRepeatsUsed === 0) {
    return "No Repeat";
  }

  return "Clean Guess";
}
