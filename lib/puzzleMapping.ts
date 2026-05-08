import type { Puzzle } from "../types/puzzle";
import type { PuzzleInsert, PuzzleRow, PuzzleUpdate } from "../types/database";

export function mapPuzzleRowToPuzzle(row: PuzzleRow): Puzzle {
  return {
    id: row.id,
    date: row.date,
    puzzleNumber: row.puzzle_number,
    status: row.status,
    isTest: row.is_test,
    countsTowardPuzzleNumber: row.counts_toward_puzzle_number,
    songTitleEnglish: row.song_title_english,
    songTitleKorean: row.song_title_korean,
    artistName: row.artist_name,
    albumArtUrl: row.album_art_url,
    source: row.source,
    sourceTrackId: row.source_track_id,
    sourceCountry: row.source_country,
    previewUrl: row.preview_url,
    previewStartSeconds: Number(row.preview_start_seconds),
    canonicalAnswerEnglish: row.canonical_answer_english,
    canonicalAnswerKorean: row.canonical_answer_korean,
    acceptedAnswers: row.accepted_answers,
    difficulty: row.difficulty,
    tags: row.tags ?? undefined,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPuzzleToPuzzleInsert(puzzle: Puzzle): PuzzleInsert {
  return {
    id: puzzle.id,
    date: puzzle.date,
    puzzle_number: puzzle.puzzleNumber,
    status: puzzle.status,
    is_test: puzzle.isTest,
    counts_toward_puzzle_number: puzzle.countsTowardPuzzleNumber,
    song_title_english: puzzle.songTitleEnglish,
    song_title_korean: puzzle.songTitleKorean ?? null,
    artist_name: puzzle.artistName,
    album_art_url: puzzle.albumArtUrl ?? null,
    source: puzzle.source,
    source_track_id: puzzle.sourceTrackId ?? null,
    source_country: puzzle.sourceCountry ?? null,
    preview_url: puzzle.previewUrl,
    preview_start_seconds: puzzle.previewStartSeconds,
    canonical_answer_english: puzzle.canonicalAnswerEnglish,
    canonical_answer_korean: puzzle.canonicalAnswerKorean ?? null,
    accepted_answers: puzzle.acceptedAnswers,
    difficulty: puzzle.difficulty ?? null,
    tags: puzzle.tags ?? null,
    notes: puzzle.notes ?? null,
    created_at: puzzle.createdAt,
    updated_at: puzzle.updatedAt,
  };
}

export function mapPuzzleToPuzzleUpdate(
  puzzle: Partial<Puzzle>,
): PuzzleUpdate {
  const update: PuzzleUpdate = {};

  setIfDefined(update, "id", puzzle.id);
  setIfDefined(update, "date", puzzle.date);
  setIfDefined(update, "puzzle_number", puzzle.puzzleNumber);
  setIfDefined(update, "status", puzzle.status);
  setIfDefined(update, "is_test", puzzle.isTest);
  setIfDefined(
    update,
    "counts_toward_puzzle_number",
    puzzle.countsTowardPuzzleNumber,
  );
  setIfDefined(update, "song_title_english", puzzle.songTitleEnglish);
  setIfDefined(update, "song_title_korean", puzzle.songTitleKorean);
  setIfDefined(update, "artist_name", puzzle.artistName);
  setIfDefined(update, "album_art_url", puzzle.albumArtUrl);
  setIfDefined(update, "source", puzzle.source);
  setIfDefined(update, "source_track_id", puzzle.sourceTrackId);
  setIfDefined(update, "source_country", puzzle.sourceCountry);
  setIfDefined(update, "preview_url", puzzle.previewUrl);
  setIfDefined(update, "preview_start_seconds", puzzle.previewStartSeconds);
  setIfDefined(update, "canonical_answer_english", puzzle.canonicalAnswerEnglish);
  setIfDefined(update, "canonical_answer_korean", puzzle.canonicalAnswerKorean);
  setIfDefined(update, "accepted_answers", puzzle.acceptedAnswers);
  setIfDefined(update, "difficulty", puzzle.difficulty);
  setIfDefined(update, "tags", puzzle.tags);
  setIfDefined(update, "notes", puzzle.notes);
  setIfDefined(update, "created_at", puzzle.createdAt);
  setIfDefined(update, "updated_at", puzzle.updatedAt);

  return update;
}

function setIfDefined<TKey extends keyof PuzzleUpdate>(
  object: PuzzleUpdate,
  key: TKey,
  value: PuzzleUpdate[TKey] | undefined,
) {
  if (value !== undefined) {
    object[key] = value;
  }
}
