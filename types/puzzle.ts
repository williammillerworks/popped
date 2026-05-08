export type PuzzleStatus = "draft" | "scheduled" | "published" | "archived";

export type PuzzleSource = "itunes" | "manual";

export type PuzzleDifficulty = "easy" | "medium" | "hard" | "deep_cut";

export type Puzzle = {
  id: string;

  date: string; // YYYY-MM-DD
  puzzleNumber: number | null;
  status: PuzzleStatus;

  isTest: boolean;
  countsTowardPuzzleNumber: boolean;

  songTitleEnglish: string;
  songTitleKorean?: string | null;
  artistName: string;
  albumArtUrl?: string | null;

  source: PuzzleSource;
  sourceTrackId?: string | null;
  sourceCountry?: string | null;
  previewUrl: string;
  previewStartSeconds: number;

  canonicalAnswerEnglish: string;
  canonicalAnswerKorean?: string | null;
  acceptedAnswers: string[];

  difficulty?: PuzzleDifficulty | null;
  tags?: string[];
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
};
