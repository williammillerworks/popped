import { DURATION_PRESET_IDS } from "../config/game";
import type {
  PuzzleDifficulty,
  PuzzleSource,
  PuzzleStatus,
} from "../types/puzzle";
import type { PuzzleInsert } from "../types/database";

export type PuzzleFormState = {
  errors: Record<string, string>;
  message: string;
  ok: boolean;
};

export const EMPTY_PUZZLE_FORM_STATE: PuzzleFormState = {
  errors: {},
  message: "",
  ok: false,
};

const VALID_STATUSES: PuzzleStatus[] = [
  "draft",
  "scheduled",
  "published",
  "archived",
];
const VALID_DIFFICULTIES: PuzzleDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "deep_cut",
];
const VALID_SOURCES: PuzzleSource[] = ["itunes", "manual"];

export function parsePuzzleFormData(formData: FormData):
  | { ok: true; puzzle: PuzzleInsert }
  | { ok: false; state: PuzzleFormState } {
  const errors: Record<string, string> = {};

  const date = getRequiredString(formData, "date", "Date is required.", errors);
  const editorId = getRequiredString(
    formData,
    "editorId",
    "Editor is required.",
    errors,
  );
  const status = getEnumValue(
    formData,
    "status",
    VALID_STATUSES,
    "Choose a valid status.",
    errors,
  );
  const songTitleEnglish = getRequiredString(
    formData,
    "songTitleEnglish",
    "English song title is required.",
    errors,
  );
  const artistName = getRequiredString(
    formData,
    "artistName",
    "Artist name is required.",
    errors,
  );
  const previewUrl = getRequiredString(
    formData,
    "previewUrl",
    "Preview URL is required.",
    errors,
  );
  const previewStartSeconds = getNonNegativeNumber(
    formData,
    "previewStartSeconds",
    "Preview start must be 0 or greater.",
    errors,
  );
  const durationPresetId = getEnumValue(
    formData,
    "durationPresetId",
    DURATION_PRESET_IDS,
    "Choose a valid duration preset.",
    errors,
  );
  const canonicalAnswerEnglish = getRequiredString(
    formData,
    "canonicalAnswerEnglish",
    "Canonical English answer is required.",
    errors,
  );
  const acceptedAnswers = getListValue(formData, "acceptedAnswers");
  const songTitleKorean = getOptionalString(formData, "songTitleKorean");
  const canonicalAnswerKorean = getOptionalString(
    formData,
    "canonicalAnswerKorean",
  );
  const albumArtUrl = getOptionalString(formData, "albumArtUrl");
  const source = getEnumValue(
    formData,
    "source",
    VALID_SOURCES,
    "Choose a valid source.",
    errors,
  );
  const sourceTrackId = getOptionalString(formData, "sourceTrackId");
  const sourceCountry = getOptionalString(formData, "sourceCountry");
  const difficulty = getOptionalEnumValue(
    formData,
    "difficulty",
    VALID_DIFFICULTIES,
    "Choose a valid difficulty.",
    errors,
  );
  const tags = getListValue(formData, "tags");
  const notes = getOptionalString(formData, "notes");
  const isTest = formData.get("isTest") === "on";
  const countsTowardPuzzleNumber =
    !isTest && formData.get("countsTowardPuzzleNumber") === "on";

  if (acceptedAnswers.length === 0) {
    errors.acceptedAnswers = "Add at least one accepted answer.";
  }

  if (previewUrl && !isHttpUrl(previewUrl)) {
    errors.previewUrl = "Preview URL must start with http:// or https://.";
  }

  if (albumArtUrl && !isHttpUrl(albumArtUrl)) {
    errors.albumArtUrl = "Album art URL must start with http:// or https://.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      state: {
        errors,
        message: "Please fix the highlighted fields.",
        ok: false,
      },
    };
  }

  return {
    ok: true,
    puzzle: {
      date,
      status,
      is_test: isTest,
      counts_toward_puzzle_number: countsTowardPuzzleNumber,
      editor_id: editorId,
      song_title_english: songTitleEnglish,
      song_title_korean: songTitleKorean,
      artist_name: artistName,
      album_art_url: albumArtUrl,
      source,
      source_track_id: sourceTrackId,
      source_country: sourceCountry,
      preview_url: previewUrl,
      preview_start_seconds: previewStartSeconds,
      duration_preset_id: durationPresetId,
      canonical_answer_english: canonicalAnswerEnglish,
      canonical_answer_korean: canonicalAnswerKorean,
      accepted_answers: acceptedAnswers,
      difficulty,
      tags: tags.length > 0 ? tags : null,
      notes,
    },
  };
}

function getRequiredString(
  formData: FormData,
  field: string,
  message: string,
  errors: Record<string, string>,
) {
  const value = getOptionalString(formData, field);

  if (!value) {
    errors[field] = message;
  }

  return value ?? "";
}

function getOptionalString(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();

  return value.length > 0 ? value : null;
}

function getNonNegativeNumber(
  formData: FormData,
  field: string,
  message: string,
  errors: Record<string, string>,
) {
  const rawValue = String(formData.get(field) ?? "").trim();
  const value = Number(rawValue);

  if (!rawValue || !Number.isFinite(value) || value < 0) {
    errors[field] = message;
    return 0;
  }

  return value;
}

function getEnumValue<TValue extends string>(
  formData: FormData,
  field: string,
  validValues: TValue[],
  message: string,
  errors: Record<string, string>,
) {
  const value = String(formData.get(field) ?? "").trim();

  if (!validValues.includes(value as TValue)) {
    errors[field] = message;
    return validValues[0];
  }

  return value as TValue;
}

function getOptionalEnumValue<TValue extends string>(
  formData: FormData,
  field: string,
  validValues: TValue[],
  message: string,
  errors: Record<string, string>,
) {
  const value = String(formData.get(field) ?? "").trim();

  if (!value) {
    return null;
  }

  if (!validValues.includes(value as TValue)) {
    errors[field] = message;
    return null;
  }

  return value as TValue;
}

function getListValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
