import type {
  PuzzleDifficulty,
  PuzzleSource,
  PuzzleStatus,
} from "./puzzle";
import type { DurationPresetId } from "../config/game";

export type Database = {
  public: {
    Tables: {
      editors: {
        Row: EditorRow;
        Insert: EditorInsert;
        Update: EditorUpdate;
        Relationships: [];
      };
      puzzles: {
        Row: PuzzleRow;
        Insert: PuzzleInsert;
        Update: PuzzleUpdate;
        Relationships: [
          {
            foreignKeyName: "puzzles_editor_id_fkey";
            columns: ["editor_id"];
            isOneToOne: false;
            referencedRelation: "editors";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type EditorRow = {
  id: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EditorInsert = {
  id?: string;
  display_name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EditorUpdate = Partial<EditorInsert>;

export type PuzzleRow = {
  id: string;
  date: string;
  puzzle_number: number | null;
  status: PuzzleStatus;
  is_test: boolean;
  counts_toward_puzzle_number: boolean;
  editor_id: string;
  song_title_english: string;
  song_title_korean: string | null;
  artist_name: string;
  album_art_url: string | null;
  source: PuzzleSource;
  source_track_id: string | null;
  source_country: string | null;
  preview_url: string;
  preview_start_seconds: number;
  duration_preset_id: DurationPresetId;
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
  editor_id: string;
  song_title_english: string;
  song_title_korean?: string | null;
  artist_name: string;
  album_art_url?: string | null;
  source?: PuzzleSource;
  source_track_id?: string | null;
  source_country?: string | null;
  preview_url: string;
  preview_start_seconds?: number;
  duration_preset_id?: DurationPresetId;
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
