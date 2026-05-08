import type {
  PuzzleDifficulty,
  PuzzleSource,
  PuzzleStatus,
} from "./puzzle";

export type Database = {
  public: {
    Tables: {
      puzzles: {
        Row: PuzzleRow;
        Insert: PuzzleInsert;
        Update: PuzzleUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type PuzzleRow = {
  id: string;
  date: string;
  puzzle_number: number | null;
  status: PuzzleStatus;
  is_test: boolean;
  counts_toward_puzzle_number: boolean;
  song_title_english: string;
  song_title_korean: string | null;
  artist_name: string;
  album_art_url: string | null;
  source: PuzzleSource;
  source_track_id: string | null;
  source_country: string | null;
  preview_url: string;
  preview_start_seconds: number;
  canonical_answer_english: string;
  canonical_answer_korean: string | null;
  accepted_answers: string[];
  difficulty: PuzzleDifficulty | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PuzzleInsert = {
  id?: string;
  date: string;
  puzzle_number?: number | null;
  status?: PuzzleStatus;
  is_test?: boolean;
  counts_toward_puzzle_number?: boolean;
  song_title_english: string;
  song_title_korean?: string | null;
  artist_name: string;
  album_art_url?: string | null;
  source?: PuzzleSource;
  source_track_id?: string | null;
  source_country?: string | null;
  preview_url: string;
  preview_start_seconds?: number;
  canonical_answer_english: string;
  canonical_answer_korean?: string | null;
  accepted_answers: string[];
  difficulty?: PuzzleDifficulty | null;
  tags?: string[] | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PuzzleUpdate = Partial<PuzzleInsert>;
