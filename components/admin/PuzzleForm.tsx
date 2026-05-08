"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";

import { STAGE_DURATIONS_SECONDS } from "../../config/game";
import { AdminAudioTimestampEditor } from "./AdminAudioTimestampEditor";
import {
  EMPTY_PUZZLE_FORM_STATE,
  type PuzzleFormState,
} from "../../lib/puzzleForm";
import type { MusicSearchResult } from "../../types/music";
import type {
  PuzzleDifficulty,
  PuzzleSource,
  PuzzleStatus,
} from "../../types/puzzle";

type PuzzleFormValues = {
  acceptedAnswers: string;
  albumArtUrl: string;
  artistName: string;
  canonicalAnswerEnglish: string;
  canonicalAnswerKorean: string;
  countsTowardPuzzleNumber: boolean;
  date: string;
  difficulty: "" | PuzzleDifficulty;
  isTest: boolean;
  notes: string;
  previewStartSeconds: string;
  previewUrl: string;
  songTitleEnglish: string;
  songTitleKorean: string;
  source: PuzzleSource;
  sourceCountry: string;
  sourceTrackId: string;
  status: PuzzleStatus;
  tags: string;
};

type PuzzleFormProps = {
  action: (
    previousState: PuzzleFormState,
    formData: FormData,
  ) => Promise<PuzzleFormState>;
  initialValues?: Partial<PuzzleFormValues>;
  mode: "create" | "edit";
};

type MusicSearchResponse = {
  error?: string;
  results?: MusicSearchResult[];
};

const DEFAULT_VALUES: PuzzleFormValues = {
  acceptedAnswers: "",
  albumArtUrl: "",
  artistName: "",
  canonicalAnswerEnglish: "",
  canonicalAnswerKorean: "",
  countsTowardPuzzleNumber: false,
  date: "",
  difficulty: "",
  isTest: true,
  notes: "",
  previewStartSeconds: "0",
  previewUrl: "",
  songTitleEnglish: "",
  songTitleKorean: "",
  source: "manual",
  sourceCountry: "US",
  sourceTrackId: "",
  status: "draft",
  tags: "",
};

const STATUS_OPTIONS: PuzzleStatus[] = [
  "draft",
  "scheduled",
  "published",
  "archived",
];
const DIFFICULTY_OPTIONS: PuzzleDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "deep_cut",
];
const SOURCE_OPTIONS: PuzzleSource[] = ["manual", "itunes"];

export function PuzzleForm({ action, initialValues, mode }: PuzzleFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_PUZZLE_FORM_STATE,
  );
  const [values, setValues] = useState<PuzzleFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [term, setTerm] = useState("");
  const [country, setCountry] = useState(values.sourceCountry || "US");
  const [showUnusableResults, setShowUnusableResults] = useState(false);
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState(
    "Search iTunes or paste a preview URL manually.",
  );
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const visibleResults = showUnusableResults
    ? results
    : results.filter((result) => Boolean(result.previewUrl));

  async function handleSearch(formData: FormData) {
    const nextTerm = String(formData.get("term") ?? "").trim();
    const nextCountry = String(formData.get("country") ?? "US")
      .trim()
      .toUpperCase();

    if (!nextTerm) {
      setSearchError("Enter a song title, artist, or combined search.");
      return;
    }

    setHasSearched(true);
    setSearchError("");
    setSearchMessage("Searching iTunes...");
    setIsSearching(true);

    try {
      const params = new URLSearchParams({
        country: nextCountry || "US",
        term: nextTerm,
      });
      const response = await fetch(`/api/admin/music-search?${params}`);
      const data = await parseMusicSearchResponse(response);

      if (!response.ok) {
        setResults([]);
        setSearchError(data.error ?? "Music search failed.");
        setSearchMessage("No results loaded.");
        return;
      }

      const nextResults = data.results ?? [];
      const usableCount = nextResults.filter((result) => result.previewUrl).length;

      setResults(nextResults);
      setSearchMessage(getSearchResultMessage(nextResults.length, usableCount));
    } catch {
      setResults([]);
      setSearchError("Music search is unavailable right now.");
      setSearchMessage("No results loaded.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectResult(result: MusicSearchResult) {
    if (!result.previewUrl) {
      setSearchError("Choose a result with a preview URL.");
      return;
    }

    setSearchError("");
    setSearchMessage(`Selected "${result.trackName}" by ${result.artistName}.`);
    setValues((currentValues) => ({
      ...currentValues,
      acceptedAnswers: ensureListIncludes(
        currentValues.acceptedAnswers,
        result.trackName,
      ),
      albumArtUrl: result.artworkUrl ?? "",
      artistName: result.artistName,
      canonicalAnswerEnglish: result.trackName,
      previewUrl: result.previewUrl ?? "",
      songTitleEnglish: result.trackName,
      source: result.source,
      sourceCountry: result.country ?? country,
      sourceTrackId: String(result.trackId),
    }));
  }

  function updateField<TKey extends keyof PuzzleFormValues>(
    field: TKey,
    value: PuzzleFormValues[TKey],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function addAlias(alias: string) {
    const trimmedAlias = alias.trim();

    if (!trimmedAlias) {
      return;
    }

    updateField(
      "acceptedAnswers",
      ensureListIncludes(values.acceptedAnswers, trimmedAlias),
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa73]">
            Music Search
          </p>
          <h2 className="text-2xl font-black tracking-[-0.04em]">
            Find the right preview
          </h2>
          <p className="text-sm leading-6 text-[#d8c8b7]">
            Search iTunes first, then verify version details before selecting.
            Manual preview URL override stays available below.
          </p>
        </div>

        <form
          action={handleSearch}
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_6rem_auto]"
        >
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#e4aa73]">
              Search
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/15 bg-[#fffaf1] px-4 text-sm font-bold text-[#211b17] outline-none transition focus:border-[#e4aa73] focus:ring-4 focus:ring-[#e4aa73]/20"
              name="term"
              onChange={(event) => setTerm(event.target.value)}
              placeholder="IVE LOVE DIVE"
              type="search"
              value={term}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#e4aa73]">
              Country
            </span>
            <input
              className="h-12 w-full rounded-2xl border border-white/15 bg-[#fffaf1] px-4 text-sm font-bold uppercase text-[#211b17] outline-none transition focus:border-[#e4aa73] focus:ring-4 focus:ring-[#e4aa73]/20"
              maxLength={2}
              name="country"
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              value={country}
            />
          </label>

          <button
            className="h-12 self-end rounded-full bg-[#fffaf1] px-5 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            disabled={isSearching}
            type="submit"
          >
            {isSearching ? "Searching" : "Search"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[#d8c8b7]" role="status">
            {searchMessage}
          </p>
          <label className="inline-flex items-center gap-2 font-bold text-[#d8c8b7]">
            <input
              checked={showUnusableResults}
              className="size-4 accent-[#e4aa73]"
              onChange={(event) => setShowUnusableResults(event.target.checked)}
              type="checkbox"
            />
            Show unusable results
          </label>
        </div>

        {searchError ? (
          <p
            className="mt-4 rounded-2xl bg-[#4b241b] px-4 py-3 text-sm font-bold text-[#ffd9ca]"
            role="alert"
          >
            {searchError}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {visibleResults.map((result) => (
            <SearchResultCard
              key={result.trackId}
              onSelect={handleSelectResult}
              result={result}
            />
          ))}
          {hasSearched && !isSearching && !searchError && visibleResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#181411]/60 p-5 text-sm font-semibold leading-6 text-[#d8c8b7]">
              <p className="font-black text-[#fffaf1]">No selectable results yet.</p>
              <p className="mt-2">
                Try adding the artist name, switching country storefronts, or
                turning on unusable results to inspect tracks without previews.
                You can still paste a preview URL manually in the form.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <form action={formAction} className="grid gap-5">
        <section className="rounded-3xl border border-white/10 bg-[#fffaf1] p-5 text-[#211b17]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b05f3c]">
                Puzzle Form
              </p>
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                {mode === "create" ? "Create puzzle" : "Edit puzzle"}
              </h2>
              <p className="text-sm leading-6 text-[#5f5148]">
                Stage durations are fixed globally and are not editable per
                puzzle.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#211b17]/15 px-4 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5"
              href="/admin/puzzles"
            >
              Back to list
            </Link>
          </div>

          <div className="mt-5 grid gap-3 rounded-3xl border border-[#211b17]/10 bg-[#f7f1e8] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
              Fixed stages
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {STAGE_DURATIONS_SECONDS.map((duration, index) => (
                <div
                  className="rounded-2xl bg-white px-3 py-2 text-center text-sm font-black"
                  key={duration}
                >
                  <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-[#8a5f3b]">
                    Stage {index + 1}
                  </span>
                  {duration}s
                </div>
              ))}
            </div>
          </div>

          {state.message ? (
            <p
              className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
                state.ok
                  ? "bg-[#d9f8c4] text-[#244512]"
                  : "bg-[#ffe0d4] text-[#7a2d1c]"
              }`}
              role="status"
            >
              {state.message}
            </p>
          ) : null}

          <ValidationSummary errors={state.errors} />

          <div className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                error={state.errors.date}
                label="Date"
                name="date"
                onChange={(value) => updateField("date", value)}
                required
                type="date"
                value={values.date}
              />
              <FormSelect
                error={state.errors.status}
                label="Status"
                name="status"
                onChange={(value) => updateField("status", value as PuzzleStatus)}
                options={STATUS_OPTIONS}
                value={values.status}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                error={state.errors.songTitleEnglish}
                label="Song title English"
                name="songTitleEnglish"
                onBlur={() => addAlias(values.songTitleEnglish)}
                onChange={(value) => updateField("songTitleEnglish", value)}
                required
                value={values.songTitleEnglish}
              />
              <FormInput
                label="Song title Korean"
                name="songTitleKorean"
                onBlur={() => addAlias(values.songTitleKorean)}
                onChange={(value) => updateField("songTitleKorean", value)}
                value={values.songTitleKorean}
              />
            </div>

            <FormInput
              error={state.errors.artistName}
              label="Artist name"
              name="artistName"
              onChange={(value) => updateField("artistName", value)}
              required
              value={values.artistName}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                error={state.errors.canonicalAnswerEnglish}
                label="Canonical answer English"
                name="canonicalAnswerEnglish"
                onBlur={() => addAlias(values.canonicalAnswerEnglish)}
                onChange={(value) =>
                  updateField("canonicalAnswerEnglish", value)
                }
                required
                value={values.canonicalAnswerEnglish}
              />
              <FormInput
                label="Canonical answer Korean"
                name="canonicalAnswerKorean"
                onBlur={() => addAlias(values.canonicalAnswerKorean)}
                onChange={(value) =>
                  updateField("canonicalAnswerKorean", value)
                }
                value={values.canonicalAnswerKorean}
              />
            </div>

            <FormTextarea
              error={state.errors.acceptedAnswers}
              helperText="One alias per line. Include English and Korean song-title aliases only, not artist names."
              label="Accepted answers"
              name="acceptedAnswers"
              onChange={(value) => updateField("acceptedAnswers", value)}
              required
              value={values.acceptedAnswers}
            />

            <div className="grid gap-4">
              <FormInput
                error={state.errors.previewUrl}
                helperText="Manual URL override is intentionally available."
                label="Preview URL"
                name="previewUrl"
                onChange={(value) => updateField("previewUrl", value)}
                required
                type="url"
                value={values.previewUrl}
              />
              <AdminAudioTimestampEditor
                error={state.errors.previewStartSeconds}
                onStartSecondsChange={(value) =>
                  updateField("previewStartSeconds", value)
                }
                previewStartSeconds={values.previewStartSeconds}
                previewUrl={values.previewUrl}
              />
            </div>

            <FormInput
              error={state.errors.albumArtUrl}
              label="Album art URL"
              name="albumArtUrl"
              onChange={(value) => updateField("albumArtUrl", value)}
              type="url"
              value={values.albumArtUrl}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormSelect
                error={state.errors.source}
                label="Source"
                name="source"
                onChange={(value) => updateField("source", value as PuzzleSource)}
                options={SOURCE_OPTIONS}
                value={values.source}
              />
              <FormInput
                label="Source track ID"
                name="sourceTrackId"
                onChange={(value) => updateField("sourceTrackId", value)}
                value={values.sourceTrackId}
              />
              <FormInput
                label="Source country"
                maxLength={2}
                name="sourceCountry"
                onChange={(value) =>
                  updateField("sourceCountry", value.toUpperCase())
                }
                value={values.sourceCountry}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                error={state.errors.difficulty}
                label="Difficulty"
                name="difficulty"
                onChange={(value) =>
                  updateField("difficulty", value as PuzzleFormValues["difficulty"])
                }
                options={DIFFICULTY_OPTIONS}
                placeholder="Not set"
                value={values.difficulty}
              />
              <FormInput
                helperText="Comma-separated or one per line."
                label="Tags"
                name="tags"
                onChange={(value) => updateField("tags", value)}
                value={values.tags}
              />
            </div>

            <FormTextarea
              label="Notes"
              name="notes"
              onChange={(value) => updateField("notes", value)}
              value={values.notes}
            />

            <div className="grid gap-3 rounded-3xl border border-[#211b17]/10 bg-[#f7f1e8] p-4">
              <label className="flex items-start gap-3 text-sm font-bold">
                <input
                  checked={values.isTest}
                  className="mt-1 size-4 accent-[#b05f3c]"
                  name="isTest"
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      countsTowardPuzzleNumber: event.target.checked
                        ? false
                        : currentValues.countsTowardPuzzleNumber,
                      isTest: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>
                  Test puzzle
                  <span className="block font-medium leading-6 text-[#5f5148]">
                    Test puzzles never count toward public puzzle numbering.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm font-bold">
                <input
                  checked={values.countsTowardPuzzleNumber}
                  className="mt-1 size-4 accent-[#b05f3c]"
                  disabled={values.isTest}
                  name="countsTowardPuzzleNumber"
                  onChange={(event) =>
                    updateField("countsTowardPuzzleNumber", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  Counts toward public puzzle number
                  <span className="block font-medium leading-6 text-[#5f5148]">
                    Disabled while this is marked as a test puzzle.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              className="h-12 rounded-full bg-[#211b17] px-6 text-sm font-black text-[#fffaf1] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create puzzle"
                  : "Save puzzle"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function SearchResultCard({
  onSelect,
  result,
}: {
  onSelect: (result: MusicSearchResult) => void;
  result: MusicSearchResult;
}) {
  const hasPreview = Boolean(result.previewUrl);
  const releaseDate = result.releaseDate?.slice(0, 10);

  return (
    <article className="grid gap-4 rounded-3xl border border-white/10 bg-[#181411]/60 p-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center">
      <div className="relative size-18 overflow-hidden rounded-2xl bg-white/10">
        {result.artworkUrl ? (
          <Image
            alt={`${result.trackName} album art`}
            className="object-cover"
            fill
            sizes="72px"
            src={result.artworkUrl}
            unoptimized
          />
        ) : null}
      </div>

      <div className="min-w-0 space-y-2">
        <div>
          <h3 className="truncate text-lg font-black tracking-[-0.03em]">
            {result.trackName}
          </h3>
          <p className="truncate text-sm font-bold text-[#fffaf1]/80">
            {result.artistName}
          </p>
        </div>

        <dl className="grid gap-1 text-xs font-semibold text-[#d8c8b7]">
          <div>
            <dt className="sr-only">Collection</dt>
            <dd>{result.collectionName ?? "Collection unknown"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>{releaseDate ?? "Date unknown"}</span>
            <span>{result.country ?? "Store unknown"}</span>
            <span>{result.primaryGenreName ?? "Genre unknown"}</span>
            <span>{result.trackExplicitness ?? "explicitness unknown"}</span>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            hasPreview
              ? "bg-[#d9f8c4] text-[#244512]"
              : "bg-[#4b241b] text-[#ffd9ca]"
          }`}
        >
          {hasPreview ? "Preview ready" : "No preview"}
        </span>
        <button
          className="h-10 rounded-full bg-[#e4aa73] px-4 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={!hasPreview}
          onClick={() => onSelect(result)}
          type="button"
        >
          Select
        </button>
      </div>
    </article>
  );
}

async function parseMusicSearchResponse(
  response: Response,
): Promise<MusicSearchResponse> {
  try {
    return (await response.json()) as MusicSearchResponse;
  } catch {
    return {
      error: "Music search returned an unreadable response. Please try again.",
      results: [],
    };
  }
}

function getSearchResultMessage(totalCount: number, usableCount: number) {
  if (totalCount === 0) {
    return "No results found. Try artist + title, Korean/English title, or another country.";
  }

  if (usableCount === 0) {
    return `Found ${totalCount} results, but none have preview URLs. Try another country or use manual preview URL override.`;
  }

  if (usableCount === 1) {
    return "Found 1 result with a preview.";
  }

  return `Found ${usableCount} results with previews.`;
}

function ValidationSummary({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-5 rounded-2xl border border-[#9d331e]/20 bg-[#ffe0d4] px-4 py-3 text-sm text-[#7a2d1c]"
      role="alert"
    >
      <p className="font-black">Fix these fields before saving:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 font-bold">
        {entries.map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

function FormInput({
  error,
  helperText,
  label,
  name,
  onBlur,
  onChange,
  required = false,
  type = "text",
  value,
  ...inputProps
}: {
  error?: string;
  helperText?: string;
  label: string;
  name: keyof PuzzleFormValues;
  onBlur?: () => void;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "onBlur" | "onChange" | "required" | "type" | "value"
>) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        {...inputProps}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-2xl border border-[#211b17]/15 bg-white px-4 text-sm font-bold text-[#211b17] outline-none transition focus:border-[#b05f3c] focus:ring-4 focus:ring-[#b05f3c]/15"
        name={name}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      <FieldHelp error={error} helperText={helperText} />
    </label>
  );
}

function FormSelect({
  error,
  label,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  error?: string;
  label: string;
  name: keyof PuzzleFormValues;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
        {label}
      </span>
      <select
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-2xl border border-[#211b17]/15 bg-white px-4 text-sm font-bold text-[#211b17] outline-none transition focus:border-[#b05f3c] focus:ring-4 focus:ring-[#b05f3c]/15"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldHelp error={error} />
    </label>
  );
}

function FormTextarea({
  error,
  helperText,
  label,
  name,
  onChange,
  required = false,
  value,
}: {
  error?: string;
  helperText?: string;
  label: string;
  name: keyof PuzzleFormValues;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#b05f3c]">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        aria-invalid={Boolean(error)}
        className="min-h-24 w-full rounded-2xl border border-[#211b17]/15 bg-white px-4 py-3 text-sm font-bold text-[#211b17] outline-none transition focus:border-[#b05f3c] focus:ring-4 focus:ring-[#b05f3c]/15"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
      <FieldHelp error={error} helperText={helperText} />
    </label>
  );
}

function FieldHelp({
  error,
  helperText,
}: {
  error?: string;
  helperText?: string;
}) {
  if (error) {
    return <span className="block text-xs font-bold text-[#9d331e]">{error}</span>;
  }

  if (helperText) {
    return (
      <span className="block text-xs font-semibold leading-5 text-[#6b5c50]">
        {helperText}
      </span>
    );
  }

  return null;
}

function ensureListIncludes(currentList: string, nextValue: string) {
  const values = currentList
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!values.includes(nextValue)) {
    values.push(nextValue);
  }

  return values.join("\n");
}

export type { PuzzleFormValues };
