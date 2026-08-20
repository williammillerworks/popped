"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useActionState, useState } from "react";

import {
  DEFAULT_DURATION_PRESET_ID,
  DURATION_PRESET_IDS,
  getDurationPreset,
  type DurationPresetId,
} from "../../config/game";
import {
  AdminAudioTimestampEditor,
  type AudioRangeValidationState,
} from "./AdminAudioTimestampEditor";
import {
  AdminAlert,
  ADMIN_BUTTON_GHOST,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_HELP_CLASS,
  AdminIcon,
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  AdminPanel,
} from "./admin-ui";
import {
  EMPTY_PUZZLE_FORM_STATE,
  type PuzzleFormState,
} from "../../lib/puzzleForm";
import type { MusicSearchResult } from "../../types/music";
import type {
  PuzzleDifficulty,
  PuzzleEditor,
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
  durationPresetId: DurationPresetId;
  editorId: string;
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
  editorOptions: PuzzleEditor[];
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
  durationPresetId: DEFAULT_DURATION_PRESET_ID,
  editorId: "",
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
const IDLE_AUDIO_RANGE_VALIDATION: AudioRangeValidationState = {
  message: "",
  status: "idle",
};

export function PuzzleForm({
  action,
  editorOptions,
  initialValues,
  mode,
}: PuzzleFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_PUZZLE_FORM_STATE,
  );
  const [values, setValues] = useState<PuzzleFormValues>({
    ...DEFAULT_VALUES,
    editorId: editorOptions[0]?.id ?? "",
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
  const [audioRangeValidation, setAudioRangeValidation] =
    useState<AudioRangeValidationState>(IDLE_AUDIO_RANGE_VALIDATION);

  const visibleResults = showUnusableResults
    ? results
    : results.filter((result) => Boolean(result.previewUrl));
  const durationPreset = getDurationPreset(values.durationPresetId);
  const stageDurations = durationPreset.stageDurations;
  const isAudioRangeBlocking =
    audioRangeValidation.status === "checking" ||
    audioRangeValidation.status === "invalid";
  const isPublishedPresetChange =
    mode === "edit" &&
    initialValues?.status === "published" &&
    initialValues.durationPresetId !== undefined &&
    values.durationPresetId !== initialValues.durationPresetId;

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

  function handlePuzzleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isAudioRangeBlocking) {
      event.preventDefault();
    }
  }

  return (
    <div className="grid gap-6">
      <AdminPanel className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-admin-accent-soft text-admin-accent">
            <AdminIcon name="search" size={19} />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Find the right preview
            </h2>
            <p className="mt-1 max-w-[65ch] text-pretty text-sm leading-6 text-admin-muted">
              Search iTunes first and verify the version details. A manual
              preview URL remains available in the audio section.
            </p>
          </div>
        </div>

        <form
          action={handleSearch}
          className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
        >
          <div className="grid gap-2">
            <label className={ADMIN_LABEL_CLASS} htmlFor="music-search-term">
              Song or artist
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-admin-subtle">
                <AdminIcon name="search" size={17} />
              </span>
              <input
                autoComplete="off"
                className={`${ADMIN_INPUT_CLASS} ps-10`}
                id="music-search-term"
                name="term"
                onChange={(event) => setTerm(event.target.value)}
                placeholder="e.g. IVE Love Dive"
                spellCheck={false}
                type="search"
                value={term}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className={ADMIN_LABEL_CLASS} htmlFor="music-search-country">
              Store
            </label>
            <input
              autoComplete="off"
              className={`${ADMIN_INPUT_CLASS} uppercase tabular-nums`}
              id="music-search-country"
              maxLength={2}
              name="country"
              onChange={(event) => setCountry(event.target.value.toUpperCase())}
              spellCheck={false}
              value={country}
            />
          </div>

          <button
            className={`${ADMIN_BUTTON_SECONDARY} self-end`}
            disabled={isSearching}
            type="submit"
          >
            <AdminIcon name="search" size={17} />
            {isSearching ? "Searching…" : "Search catalog"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3 border-t border-admin-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-pretty text-admin-muted" role="status">
            {searchMessage}
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm font-medium text-admin-muted hover:bg-admin-surface-subtle">
            <input
              checked={showUnusableResults}
              className="size-4 accent-admin-accent"
              onChange={(event) => setShowUnusableResults(event.target.checked)}
              type="checkbox"
            />
            Show tracks without previews
          </label>
        </div>

        {searchError ? (
          <AdminAlert className="mt-4" title="Music search failed" variant="error">
            {searchError}
          </AdminAlert>
        ) : null}

        <div className="mt-5 grid gap-3">
          {isSearching
            ? Array.from({ length: 3 }, (_, index) => (
                <div
                  aria-hidden="true"
                  className="h-28 animate-pulse rounded-xl bg-admin-surface-subtle"
                  key={index}
                />
              ))
            : visibleResults.map((result) => (
                <SearchResultCard
                  key={result.trackId}
                  onSelect={handleSelectResult}
                  result={result}
                />
              ))}
          {hasSearched && !isSearching && !searchError && visibleResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-admin-border-strong bg-admin-surface-subtle/60 p-5 text-sm leading-6 text-admin-muted">
              <p className="font-semibold text-admin-text">No selectable tracks found</p>
              <p className="mt-1 text-pretty">
                Add the artist name, try another storefront, or show tracks
                without previews. You can also paste a preview URL manually.
              </p>
            </div>
          ) : null}
        </div>
      </AdminPanel>

      <form action={formAction} className="grid gap-6" onSubmit={handlePuzzleSubmit}>
        {state.message ? (
          <AdminAlert
            title={state.ok ? "Changes saved" : "Puzzle was not saved"}
            variant={state.ok ? "success" : "error"}
          >
            {state.message}
          </AdminAlert>
        ) : null}

        <ValidationSummary errors={state.errors} />

        <FormSection
          description="Choose when the puzzle appears, who owns the edit, and which clue timing preset it uses."
          step="01"
          title="Schedule and ownership"
        >
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className={ADMIN_LABEL_CLASS} htmlFor="durationPresetId">
                Duration preset <span aria-hidden="true">*</span>
              </label>
              <select
                aria-describedby="durationPresetId-help"
                aria-invalid={Boolean(state.errors.durationPresetId)}
                className={ADMIN_INPUT_CLASS}
                id="durationPresetId"
                name="durationPresetId"
                onChange={(event) =>
                  updateField(
                    "durationPresetId",
                    event.target.value as DurationPresetId,
                  )
                }
                required
                value={values.durationPresetId}
              >
                {DURATION_PRESET_IDS.map((durationPresetId) => {
                  const option = getDurationPreset(durationPresetId);

                  return (
                    <option key={durationPresetId} value={durationPresetId}>
                      {option.label} ({durationPresetId})
                    </option>
                  );
                })}
              </select>
              <FieldHelp
                error={state.errors.durationPresetId}
                helperText={durationPreset.description}
                id="durationPresetId-help"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {stageDurations.map((duration, index) => (
                <div
                  className="rounded-lg bg-admin-surface-subtle px-2 py-2.5 text-center text-sm font-semibold tabular-nums"
                  key={`${values.durationPresetId}-${duration}`}
                >
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-admin-subtle">
                    Stage {index + 1}
                  </span>
                  <span className="mt-0.5 block">{duration}s</span>
                </div>
              ))}
            </div>

            {isPublishedPresetChange ? (
              <AdminAlert title="This changes a published puzzle" variant="warning">
                Saving a new duration preset changes clue timing for anyone who
                opens this puzzle afterward.
              </AdminAlert>
            ) : null}

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

            <div className="grid gap-2">
              <label className={ADMIN_LABEL_CLASS} htmlFor="editorId">
                Editor <span aria-hidden="true">*</span>
              </label>
              <select
                aria-describedby={state.errors.editorId ? "editorId-help" : undefined}
                aria-invalid={Boolean(state.errors.editorId)}
                className={ADMIN_INPUT_CLASS}
                id="editorId"
                name="editorId"
                onChange={(event) => updateField("editorId", event.target.value)}
                required
                value={values.editorId}
              >
                <option value="">Choose an editor</option>
                {editorOptions.map((editor) => (
                  <option key={editor.id} value={editor.id}>
                    {editor.name}
                  </option>
                ))}
              </select>
              <FieldHelp error={state.errors.editorId} id="editorId-help" />
            </div>
          </div>
        </FormSection>

        <FormSection
          description="Use the exact display metadata and include every valid song-title alias players may enter."
          step="02"
          title="Track identity"
        >
          <div className="grid gap-4">

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
          </div>
        </FormSection>

        <FormSection
          description="Confirm the source audio, then audition every clue length from one shared start timestamp."
          step="03"
          title="Audio preview"
        >
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
                onRangeValidationChange={setAudioRangeValidation}
                onStartSecondsChange={(value) =>
                  updateField("previewStartSeconds", value)
                }
                previewStartSeconds={values.previewStartSeconds}
                previewUrl={values.previewUrl}
                stageDurations={stageDurations}
              />
              {audioRangeValidation.status === "checking" ? (
                <AdminAlert title="Checking audio range" variant="info">
                  {audioRangeValidation.message}
                </AdminAlert>
              ) : null}

            <FormInput
              error={state.errors.albumArtUrl}
              label="Album art URL"
              name="albumArtUrl"
              onChange={(value) => updateField("albumArtUrl", value)}
              type="url"
              value={values.albumArtUrl}
            />
          </div>
        </FormSection>

        <FormSection
          description="Keep the source reference and optional editorial classification attached to the puzzle."
          step="04"
          title="Catalog metadata"
        >
          <div className="grid gap-4">
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

            <div className="grid gap-2 rounded-xl bg-admin-surface-subtle p-2">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-3 text-sm font-medium hover:bg-admin-surface">
                <input
                  checked={values.isTest}
                  className="mt-0.5 size-4 shrink-0 accent-admin-accent"
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
                  <span className="mt-0.5 block font-normal leading-5 text-admin-muted">
                    Test puzzles never count toward public puzzle numbering.
                  </span>
                </span>
              </label>

              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-3 text-sm font-medium hover:bg-admin-surface has-disabled:cursor-not-allowed has-disabled:text-admin-subtle">
                <input
                  checked={values.countsTowardPuzzleNumber}
                  className="mt-0.5 size-4 shrink-0 accent-admin-accent"
                  disabled={values.isTest}
                  name="countsTowardPuzzleNumber"
                  onChange={(event) =>
                    updateField("countsTowardPuzzleNumber", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  Counts toward public puzzle number
                  <span className="mt-0.5 block font-normal leading-5 text-admin-muted">
                    Disabled while this is marked as a test puzzle.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-admin-floating backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <p className="px-1 text-sm text-admin-muted">
            {mode === "create"
              ? "New puzzles start as test-safe drafts."
              : "Review audio timing before saving live changes."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link className={ADMIN_BUTTON_GHOST} href="/admin/puzzles">
              Cancel
            </Link>
            <button
              className={ADMIN_BUTTON_PRIMARY}
              disabled={isPending || isAudioRangeBlocking}
              type="submit"
            >
              {isPending
                ? mode === "create"
                  ? "Creating puzzle…"
                  : "Saving changes…"
                : audioRangeValidation.status === "checking"
                  ? "Checking audio…"
                  : audioRangeValidation.status === "invalid"
                    ? "Fix audio range"
                    : mode === "create"
                      ? "Create puzzle"
                      : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  children,
  description,
  step,
  title,
}: {
  children: React.ReactNode;
  description: string;
  step: string;
  title: string;
}) {
  return (
    <AdminPanel className="overflow-hidden">
      <div className="grid gap-3 border-b border-admin-border px-5 py-5 sm:grid-cols-[2.25rem_1fr] sm:px-6">
        <span className="grid size-8 place-items-center rounded-lg bg-admin-surface-subtle text-xs font-semibold tabular-nums text-admin-muted">
          {step}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.015em]">{title}</h2>
          <p className="mt-1 max-w-[65ch] text-pretty text-sm leading-6 text-admin-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </AdminPanel>
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
    <article className="grid gap-4 rounded-xl border border-admin-border bg-admin-surface-subtle/45 p-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="relative grid size-16 place-items-center overflow-hidden rounded-lg bg-admin-surface-strong text-admin-subtle outline-1 -outline-offset-1 outline-black/10">
        {result.artworkUrl ? (
          <Image
            alt={`${result.trackName} album art`}
            className="object-cover outline-1 -outline-offset-1 outline-black/10"
            fill
            sizes="64px"
            src={result.artworkUrl}
            unoptimized
          />
        ) : (
          <AdminIcon name="music" size={20} />
        )}
      </div>

      <div className="min-w-0">
        <div>
          <h3
            className="truncate text-sm font-semibold text-admin-text"
            title={result.trackName}
          >
            {result.trackName}
          </h3>
          <p
            className="mt-0.5 truncate text-sm text-admin-muted"
            title={result.artistName}
          >
            {result.artistName}
          </p>
        </div>

        <dl className="mt-2 grid gap-1 text-xs text-admin-subtle">
          <div>
            <dt className="sr-only">Collection</dt>
            <dd
              className="truncate"
              title={result.collectionName ?? "Collection unknown"}
            >
              {result.collectionName ?? "Collection unknown"}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="tabular-nums">{releaseDate ?? "Date unknown"}</span>
            <span>{result.country ?? "Store unknown"}</span>
            <span>{result.primaryGenreName ?? "Genre unknown"}</span>
            <span>{result.trackExplicitness ?? "explicitness unknown"}</span>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <span
          className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium ${
            hasPreview
              ? "bg-admin-success-soft text-admin-success"
              : "bg-admin-destructive-soft text-admin-destructive"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {hasPreview ? "Preview ready" : "No preview"}
        </span>
        <button
          className={ADMIN_BUTTON_SECONDARY}
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
    <AdminAlert title="Fix the highlighted fields before saving" variant="error">
      <ul className="mt-1 list-disc space-y-1 ps-4">
        {entries.map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </AdminAlert>
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
  const id = String(name);
  const helpId = `${id}-help`;

  return (
    <div className="grid gap-2">
      <label className={ADMIN_LABEL_CLASS} htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        {...inputProps}
        aria-describedby={error || helperText ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={ADMIN_INPUT_CLASS}
        id={id}
        name={name}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      <FieldHelp error={error} helperText={helperText} id={helpId} />
    </div>
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
  const id = String(name);
  const helpId = `${id}-help`;

  return (
    <div className="grid gap-2">
      <label className={ADMIN_LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <select
        aria-describedby={error ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={ADMIN_INPUT_CLASS}
        id={id}
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
      <FieldHelp error={error} id={helpId} />
    </div>
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
  const id = String(name);
  const helpId = `${id}-help`;

  return (
    <div className="grid gap-2">
      <label className={ADMIN_LABEL_CLASS} htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        aria-describedby={error || helperText ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={`${ADMIN_INPUT_CLASS} min-h-28 py-3 leading-6`}
        id={id}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        required={required}
        value={value}
      />
      <FieldHelp error={error} helperText={helperText} id={helpId} />
    </div>
  );
}

function FieldHelp({
  error,
  helperText,
  id,
}: {
  error?: string;
  helperText?: string;
  id?: string;
}) {
  if (error) {
    return (
      <span
        className="flex items-start gap-1.5 text-[0.8125rem] font-medium leading-5 text-admin-destructive"
        id={id}
        role="alert"
      >
        <span className="mt-0.5 shrink-0" aria-hidden="true">
          <AdminIcon name="alert" size={14} />
        </span>
        {error}
      </span>
    );
  }

  if (helperText) {
    return (
      <span className={ADMIN_HELP_CLASS} id={id}>
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
