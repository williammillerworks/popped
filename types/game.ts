import type { DurationPresetId, StageNumber } from "../config/game";

export type GameSession = {
  puzzleId: string;
  puzzleDate: string;
  durationPresetId: DurationPresetId;
  stageDurations: number[];
  startedAt?: string;
  completedAt?: string;
  currentStage: StageNumber;
  guesses: string[];
  totalRepeatsUsed: number;
  hasUsedRepeat: boolean;
  solved: boolean;
  solvedStage?: StageNumber;
  revealed: boolean;
};

export type ActiveGameSession = {
  puzzleId: string;
  puzzleDate: string;
  updatedAt: string;
};

export type GameResult = {
  puzzleId: string;
  puzzleNumber: number;
  puzzleDate?: string;
  completedAt?: string;
  solved: boolean;
  solvedStage?: StageNumber;
  solvedClipDuration?: number;
  totalGuesses: number;
  totalRepeatsUsed: number;
  hasUsedRepeat: boolean;
  resultLabel: string;
  showSpoiler?: boolean;
};
