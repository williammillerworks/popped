import type { StageNumber } from "../config/game";

export type GameSession = {
  puzzleId: string;
  startedAt?: string;
  completedAt?: string;
  currentStage: StageNumber;
  guesses: string[];
  repeatsUsedByStage: Partial<Record<StageNumber, boolean>>;
  solved: boolean;
  solvedStage?: StageNumber;
  revealed: boolean;
};

export type GameResult = {
  puzzleId: string;
  puzzleNumber: number;
  solved: boolean;
  solvedStage?: StageNumber;
  solvedClipDuration?: number;
  totalGuesses: number;
  totalRepeatsUsed: number;
  resultLabel: string;
};
