# POPPED PRD v0.2

## Version Note

This PRD reflects the founder decisions from the latest product discussion.

Major decisions locked for MVP:

- Answer is **song title only**.
- Accepted answers should support both **English and Korean** song titles/aliases.
- No artist hints in MVP.
- Album art appears only after reveal.
- Puzzle numbering starts at **#1 on launch day**.
- Test puzzles should not count toward public puzzle numbering.
- Stage durations are fixed globally.
- Failed users cannot replay individual stages after reveal, but the result screen should start or offer the longer reveal preview from the puzzle start timestamp.
- Result card should support a small spoiler-hide option.
- Admin should support direct Apple/iTunes music search in MVP.
- No practice mode for now.
- Brand voice is **clean and playful**, not overly teasing or dramatic.

---

# 1. Product Summary

**POPPED** is a daily K-pop audio guessing web game where players identify a song title from ultra-short snippets.

The product turns passive K-pop fandom into a short daily ritual: hear a tiny clip, recognize the song, type the answer, reveal the result, and share proof.

POPPED should feel simple, fast, beautiful, and slightly addictive in the same way good daily games feel addictive.

The product is not trying to be a full music platform.

The product is a **daily recognition ritual**.

---

# 2. One-Sentence Product Description

**How fast can you guess today’s K-pop song?**

Alternative internal wording:

**A daily K-pop audio challenge where fans prove how quickly they recognize a song from tiny snippets.**

---

# 3. Product Mission

Make people’s time feel well-spent every day through a tiny, beautiful, skill-based music ritual.

The user should feel:

- “That was quick.”
- “That was fun.”
- “I should send this to someone.”
- “I want to come back tomorrow.”

---

# 4. Product Thesis

POPPED is not trying to become a general music app, playlist app, fandom social network, or music discovery product in MVP.

POPPED is a daily recognition game.

The core loop is:

> Hear → Know → Guess → Reveal → Flex

Everything in MVP should protect this loop.

---

# 5. Product Principles

## 5.1 Functional Yet Beautiful

The app must be useful first.

The beauty should come from clarity, rhythm, spacing, timing, restraint, and confidence.

The product should not feel over-designed, decorative, or heavy.

## 5.2 Don’t Make the User Think

The user should understand the game immediately.

No long onboarding.

No complicated mode selection.

No unnecessary choices before playing.

## 5.3 Audio First

This product is about the moment of hearing.

The UI should support the audio moment, not compete with it.

## 5.4 Daily Ritual, Not Infinite Feed

MVP should focus on one daily challenge.

No endless scrolling.

No archive in MVP.

No practice mode in MVP.

## 5.5 Editorial Quality Matters

The game depends on good puzzle curation.

The admin tool is part of the product, not a side panel.

---

# 6. Target User

## 6.1 Primary User

International K-pop fans, especially people who:

- Know many songs by ear
- Like daily games
- Like sharing results
- Are active in fandom spaces
- Enjoy proving taste/knowledge casually

## 6.2 Age Range

Approximate main audience: **10–30s**.

The tone should be young enough to feel playful, but not childish.

## 6.3 Launch Language

English first.

## 6.4 Answer Language Support

Even though the UI launches in English, answers should support both:

- English song title
- Korean song title

Example:

```json
{
  "canonicalTitle": "I AM",
  "acceptedAnswers": ["i am", "아이엠"]
}
```

---

# 7. MVP Scope

## 7.1 Must Have

1. Daily public game page
2. Start button
3. Countdown before the first audio clue
4. Seven fixed audio stages
5. One repeat per stage
6. Song-title-only guess input
7. English and Korean accepted-answer aliases
8. Answer normalization
9. Correct/incorrect feedback
10. Final result screen
11. Spoiler-hide option on result card
12. Shareable result text
13. Admin authentication
14. Admin puzzle calendar/list
15. Admin create/edit puzzle
16. Admin direct music search
17. Admin preview URL selection
18. Admin start timestamp editor
19. Admin stage preview for all seven stages
20. Automatic public puzzle numbering from launch puzzle onward

## 7.2 Explicitly Out of Scope

- User accounts
- Leaderboards
- Friend system
- Multiplayer
- Paid membership
- Archive mode
- Practice mode
- Hard mode
- Artist hints
- Native mobile app
- Push notifications
- Multiple UI languages
- Advanced stats dashboard
- Social feed
- Full typo-tolerant search
- Server-side anti-cheat

---

# 8. Game Mechanics

## 8.1 Daily Puzzle

Each public day has one puzzle.

A puzzle consists of:

- Song metadata
- Preview URL
- Start timestamp
- Fixed stage durations
- Accepted answers
- Reveal data
- Public date
- Public puzzle number

## 8.2 Stage Durations

Stage durations are fixed globally for MVP.

| Stage | Duration |
| ----- | -------- |
| 1     | 0.2s     |
| 2     | 0.4s     |
| 3     | 0.8s     |
| 4     | 1.0s     |
| 5     | 1.5s     |
| 6     | 2.0s     |
| 7     | 3.0s     |

These values should live in one shared config file.

Example:

```ts
export const STAGE_DURATIONS_SECONDS = [0.2, 0.4, 0.8, 1.0, 1.5, 2.0, 3.0] as const;
```

Do not make durations editable per puzzle in MVP. If duration tuning is needed, update the global duration config rather than adding per-puzzle duration controls.

## 8.3 Stage Behavior

At each stage, the user can:

- Hear the snippet automatically when entering the stage (after countdown)
- Repeat the current stage once
- Submit guesses
- Move to next clue

Once the user moves forward, they cannot return to earlier stages.

## 8.4 Repeat Behavior

- One repeat per stage
- Repeat starts without countdown
- Repeat button disables after being used on that stage
- Repeat availability resets on the next stage
- Total repeat count should be tracked for result display

## 8.5 Guess Behavior

- User guesses song title only
- Artist + title should not be required
- Artist-only guess should not count as correct
- Unlimited guesses for MVP
- English and Korean accepted answers should work
- Guess input should normalize common formatting differences

## 8.6 Win Condition

The player wins when the normalized submitted guess matches one normalized accepted answer.

## 8.7 Lose Condition

The player loses if they reach the end of Stage 7 and choose to reveal the answer.

After Stage 7, the primary action becomes:

> Reveal Answer

---

# 9. Reveal and Post-Game Audio Behavior

## 9.1 Successful User

After a correct guess:

- Show result screen
- Reveal title, artist, and album art
- Allow sharing
- Automatically start the reveal preview from the puzzle start timestamp, if browser audio rules allow it
- Provide a replay button for the longer reveal preview

## 9.2 Failed User

After reveal:

- Show result screen with failed state
- Reveal title, artist, and album art
- Allow sharing
- Do **not** allow replaying individual stages
- Automatically start the reveal preview from the puzzle start timestamp, if browser audio rules allow it
- Provide a replay button for the longer reveal preview

## 9.3 Reveal Preview

The reveal preview should start at the puzzle’s selected start timestamp and play until the preview audio ends.

Example:

If preview is 30s and `previewStartSeconds = 8.4`, reveal preview plays from `8.4s` to the end.

This creates a satisfying “oh, that was it” moment without letting users replay the puzzle stage-by-stage.

## 9.4 Autoplay and Browser Behavior

Reveal preview behavior should be the same for both solved and failed users.

The preferred behavior is automatic playback when the result screen appears. However, because mobile browsers may block delayed autoplay, the app must gracefully fall back to showing a clear **Play Preview** button.

If autoplay fails:

- Do not show an error as if something broke
- Show the replay/play button normally
- Let the user manually start the reveal preview

---

# 10. Core User Flow

1. User opens site.
2. User sees POPPED title, date/puzzle number, and Start button.
3. User taps Start.
4. Countdown appears: 3 → 2 → 1.
5. Stage 1 audio plays.
6. User submits guess, repeats, or moves to next clue.
7. User continues until correct or reveal.
8. Result screen appears.
9. User can hide/show spoiler info on result card.
10. User shares result text or screenshot.

---

# 11. Public Pages

## 11.1 `/`

Main daily game page.

If today has a published puzzle:

- Show POPPED branding
- Show puzzle number
- Show Start button
- Render active game after Start

If today has no published puzzle:

- Show graceful empty state
- Example: “Today’s POPPED is warming up. Come back soon.”

## 11.2 `/admin`

Admin entry point.

Requires authentication.

## 11.3 `/admin/puzzles`

Puzzle calendar/list view.

## 11.4 `/admin/puzzles/new`

Create puzzle.

## 11.5 `/admin/puzzles/:id`

Edit puzzle.

---

# 12. Game UI Requirements

## 12.1 Pre-Start Screen

Must include:

- POPPED logo/title
- One-line description
- Puzzle number
- Start button

Possible copy:

> Guess today’s K-pop song from tiny audio clues.

## 12.2 Countdown Screen

After pressing Start:

- Display 3, 2, 1
- Then immediately play Stage 1
- Countdown should feel rhythmic and responsive

## 12.3 Active Game Screen

Must include:

- Stage number
- Clip duration
- Guess input
- Submit button
- Repeat button
- Next Clue button
- Stage progress indicator

Example:

```text
Stage 3 / 7
0.8s

[Guess the song title]
[Submit]

[Repeat] [Next Clue]
```

## 12.4 Incorrect Feedback

Keep feedback lightweight.

Example copy:

- “Not it.”
- “Try again.”
- “Nope.”
- “Almost maybe.”

Avoid harsh or dramatic language.

## 12.5 Correct Feedback

After correct answer:

- Brief success state is okay
- Move quickly to result screen

Example:

> Popped.

---

# 13. Result Screen

The result screen is one of the most important surfaces in the product.

It should feel good enough to screenshot.

## 13.1 Must Include

- Solved/failed state
- Result label
- Stage solved, if solved
- Clip duration solved, if solved
- Guess count
- Repeat count
- Song title
- Korean title if available
- Artist name
- Album art
- Spoiler hide/show button
- Share button
- Reveal preview play button

## 13.2 Spoiler Hide Button

The result card should include a small hide/show control.

Purpose:

- Let users screenshot/share result without spoiling the answer
- Let users reveal details for themselves

Behavior:

- Default state after result can show answer to the player
- Tapping “Hide spoiler” hides title, artist, and album art
- Tapping “Show spoiler” reveals them again
- Share text should not include song title by default

## 13.3 Result Labels

Brand voice: clean and playful.

Not too teasing.

Not too dramatic.

Example labels:

- **Intro Sharp** — solved very early
- **Fast Ear** — solved before 1.0s
- **Clean Guess** — solved with few guesses
- **No Repeat** — solved without repeats
- **One Shot** — solved with one guess
- **Still Got It** — solved late
- **Not Today** — failed

Avoid labels that feel too mean or too meme-heavy in MVP.

## 13.4 MVP Label Logic

Simple deterministic logic is enough.

Example:

```ts
export function getResultLabel(result: GameResult): string {
  if (!result.solved) return "Not Today";
  if (result.solvedStage <= 2 && result.totalGuesses === 1) return "Intro Sharp";
  if (result.totalRepeatsUsed === 0) return "No Repeat";
  if (result.totalGuesses === 1) return "One Shot";
  if (result.solvedClipDuration <= 1.0) return "Fast Ear";
  if (result.solvedStage === 7) return "Still Got It";
  return "Clean Guess";
}
```

---

# 14. Share Result

## 14.1 Share Philosophy

The share result should be a small proof of fandom skill.

It should not reveal the song title by default.

## 14.2 Share Text Example: Solved

```text
POPPED #18
🎧 Solved in 0.8s
🔁 0 repeats
💬 2 guesses
🏷 Fast Ear

popped.example.com
```

## 14.3 Share Text Example: Failed

```text
POPPED #18
🎧 Missed today’s song
🔁 3 repeats
💬 8 guesses
🏷 Not Today

popped.example.com
```

## 14.4 Requirements

- Use Web Share API when available
- Fallback to copy-to-clipboard
- Show success feedback after share/copy
- Do not include song title by default
- Keep text compact

---

# 15. Answer Matching

## 15.1 Requirement

The answer is song title only.

The app should accept both English and Korean title aliases.

The product should feel forgiving, not pedantic.

## 15.2 Admin-Defined Answer Fields

Each puzzle should support:

- Canonical English title
- Canonical Korean title, optional
- Accepted answer aliases

Example:

```json
{
  "canonicalTitleEnglish": "LOVE DIVE",
  "canonicalTitleKorean": "러브 다이브",
  "acceptedAnswers": [
    "love dive",
    "lovedive",
    "러브 다이브",
    "러브다이브"
  ]
}
```

## 15.3 Normalization Rules

Before matching:

- Lowercase English text
- Trim whitespace
- Collapse repeated spaces
- Remove punctuation
- Remove common symbols
- Normalize smart quotes/apostrophes
- Preserve Korean characters
- Remove spaces for an additional comparison pass

## 15.4 Matching Strategy

Use exact match after normalization.

Also compare a compact version with spaces removed.

Example:

```ts
normalize("LOVE DIVE") === normalize("love dive")
compactNormalize("LOVE DIVE") === compactNormalize("lovedive")
```

## 15.5 Not Required for MVP

- Typo tolerance
- Romanization engine
- Artist-name guesses
- Autocomplete
- Partial matching

---

# 16. Puzzle Numbering

## 16.1 Requirement

Public puzzle numbering starts at **#1 on launch day**.

Test puzzles should not count.

If test puzzles are created and later deleted, the first real launch puzzle should still become #1.

## 16.2 Recommended Data Model

Add field:

```ts
countsTowardPuzzleNumber: boolean;
```

Default:

- Draft/test puzzle: false by default if marked test
- Real scheduled/published puzzle: true

Add field:

```ts
puzzleNumber: number | null;
```

## 16.3 Number Assignment Rule

When a puzzle is marked as scheduled/published and `countsTowardPuzzleNumber = true`:

- Assign the next public puzzle number based on existing countable puzzles ordered by date
- First countable public puzzle becomes #1

For MVP, simplest safe behavior:

- Admin can mark puzzle as “Count as public puzzle”
- On publish/schedule, if `puzzleNumber` is empty, set it to `max(existing puzzleNumber) + 1`
- Test puzzles should keep `puzzleNumber = null`

## 16.4 Future Improvement

If changing dates after publishing becomes common, add a renumbering tool.

Do not overbuild this in MVP.

---

# 17. Admin Product Requirements

The admin tool is a first-class product.

Daily puzzle quality depends on admin usability.

Admin should make it easy to:

- Search for a song
- Select preview song with URL
- Choose puzzle start point
- Preview all stages
- Add accepted answers
- Schedule/publish
- See calendar/list of puzzles

---

# 18. Admin Authentication

MVP authentication should be simple but real.

Recommended options:

- Supabase Auth with allowlisted emails
- Clerk with allowlisted emails
- NextAuth with allowlisted emails

Admin routes must not allow public edits.

---

# 19. Admin Dashboard

## 19.1 Calendar/List View

Admin should see:

- Date
- Puzzle number
- Song title
- Artist
- Status
- Counted/not counted
- Difficulty
- Missing days

## 19.2 Status Values

```ts
type PuzzleStatus = "draft" | "scheduled" | "published" | "archived";
```

## 19.3 Test Puzzle Handling

Admin should be able to create test puzzles without affecting public numbering.

Use:

```ts
isTest: boolean;
countsTowardPuzzleNumber: boolean;
```

For MVP, one of these fields is enough, but both can make intent clearer.

Recommended:

- `isTest`
- `countsTowardPuzzleNumber`

---

# 20. Admin Music Search

## 20.1 Requirement

Admin should support direct music search in MVP.

The admin should not require manually pasting preview URLs as the primary flow.

The search experience should help the admin avoid choosing the wrong version of a song. K-pop tracks often have Japanese versions, remixes, instrumentals, re-releases, duplicate album entries, and region-specific catalog differences.

## 20.2 MVP Search Approach

Use a server-side API route that calls the public iTunes Search API.

Search should support:

- Song title
- Artist name
- Combined query
- Country/storefront parameter, default `US`

Recommended endpoint:

```text
GET /api/admin/music-search?term={query}&country=US
```

This endpoint should return normalized result objects for the admin UI.

## 20.3 Search Result Fields

Admin search result should include:

```ts
type MusicSearchResult = {
  source: "itunes";
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  releaseDate?: string;
  artworkUrl?: string;
  previewUrl?: string;
  country?: string;
  primaryGenreName?: string;
  trackExplicitness?: string;
};
```

## 20.4 Search Result Display

Each admin search result should show enough metadata to verify the correct track before selection:

- Track name
- Artist name
- Album/collection name
- Release date, if available
- Country/storefront
- Preview availability
- Album art thumbnail, if available

Results without a preview URL should be visually marked as unusable or hidden by default.

## 20.5 Admin Selection Behavior

When admin selects a search result:

- Fill song title
- Fill artist
- Fill album/collection metadata if available
- Fill album art
- Fill preview URL
- Fill source track ID
- Fill source country/storefront
- Set default accepted answer to track title
- Admin can add Korean title/aliases manually

## 20.6 Fallback

Even with direct search, admin should still allow manual preview URL override.

Reason:

- Some tracks may not appear
- Some previews may fail
- Different countries may return different results
- Search may return the wrong version, such as a remix, instrumental, Japanese version, or duplicate release

---

# 21. Puzzle Creation Flow

## 21.1 Required Fields

- Date
- Status
- Song title English
- Artist name
- Preview URL
- Preview start seconds
- Canonical English answer
- At least one accepted answer
- Count as public puzzle? yes/no

## 21.2 Optional Fields

- Song title Korean
- Korean aliases
- Album art URL
- Source track ID
- Source country
- Difficulty
- Tags
- Admin notes

## 21.3 Admin Preview Controls

Admin must be able to:

- Play full preview
- Adjust start timestamp
- Preview Stage 1
- Preview Stage 2
- Preview Stage 3
- Preview Stage 4
- Preview Stage 5
- Preview Stage 6
- Preview Stage 7
- Play reveal preview from start timestamp to end

## 21.4 Publish Validation

A puzzle should not be publishable unless:

- Date exists
- Song title exists
- Artist exists
- Preview URL exists
- Canonical answer exists
- At least one accepted answer exists
- Start timestamp exists
- Preview URL loads successfully in admin, if feasible

---

# 22. Audio Requirements

## 22.1 Stage Playback

Each puzzle has one admin-selected `previewStartSeconds`. All stages play from that same start timestamp, using the globally configured stage durations.

Example:

If `previewStartSeconds = 8.4`:

- Stage 1: 8.4 → 8.6 (0.2 sec duration)
- Stage 2: 8.4 → 8.8 (0.4 sec duration)
- Stage 3: 8.4 → 9.2 (0.8 sec duration)
- Stage 4: 8.4 → 9.4 (1 sec duration)
- Stage 5: 8.4 → 9.9 (1.5 sec duration)
- Stage 6: 8.4 → 10.4 (2 sec duration)
- Stage 7: 8.4 → 11.4 (3 sec duration)

## 22.2 Reveal Playback

Reveal playback starts from `previewStartSeconds` and plays until the preview ends.

## 22.3 Playback Implementation Notes

Use `HTMLAudioElement` for MVP.

Pseudo-logic:

```ts
function playSnippet(audio: HTMLAudioElement, startSeconds: number, durationSeconds: number) {
  audio.pause();
  audio.currentTime = startSeconds;
  audio.play();

  const stopAt = startSeconds + durationSeconds;

  const interval = window.setInterval(() => {
    if (audio.currentTime >= stopAt) {
      audio.pause();
      window.clearInterval(interval);
    }
  }, 10);

  return () => {
    window.clearInterval(interval);
    audio.pause();
  };
}
```

Need to handle:

- Audio loading state
- Mobile autoplay restrictions
- User gesture requirement
- Repeated taps
- Cleanup on unmount
- Playback error state

---

# 23. Technical Stack

Recommended MVP stack:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase Postgres
- Supabase Auth
- Vercel

Avoid overcomplication.

Do not add state management libraries unless necessary.

Do not add animation libraries in MVP unless the UI truly needs it.

---

# 24. Suggested App Structure

```text
/app
  /(public)
    page.tsx
  /admin
    page.tsx
    /puzzles
      page.tsx
      /new
        page.tsx
      /[id]
        page.tsx
  /api
    /today
      route.ts
    /admin
      /music-search
        route.ts
      /puzzles
        route.ts
      /puzzles/[id]
        route.ts
/components
  /game
    GameShell.tsx
    Countdown.tsx
    AudioStagePlayer.tsx
    GuessInput.tsx
    StageControls.tsx
    ResultCard.tsx
    ShareResultButton.tsx
    RevealPreviewPlayer.tsx
  /admin
    PuzzleForm.tsx
    PuzzleList.tsx
    MusicSearchBox.tsx
    MusicSearchResults.tsx
    StagePreview.tsx
    AudioTimestampEditor.tsx
/lib
  audio.ts
  answerMatching.ts
  scoring.ts
  share.ts
  dates.ts
  validation.ts
  musicSearch.ts
  puzzleNumbering.ts
/config
  game.ts
/types
  puzzle.ts
  game.ts
  music.ts
```

---

# 25. Core Types

## 25.1 Puzzle

```ts
type PuzzleStatus = "draft" | "scheduled" | "published" | "archived";

type Puzzle = {
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

  source: "itunes" | "manual";
  sourceTrackId?: string | null;
  sourceCountry?: string | null;
  previewUrl: string;
  previewStartSeconds: number;

  canonicalAnswerEnglish: string;
  canonicalAnswerKorean?: string | null;
  acceptedAnswers: string[];

  difficulty?: "easy" | "medium" | "hard" | "deep_cut" | null;
  tags?: string[];
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
};
```

## 25.2 Game Session

MVP can keep this client-side.

```ts
type GameSession = {
  puzzleId: string;
  startedAt?: string;
  completedAt?: string;
  currentStage: number;
  guesses: string[];
  repeatsUsedByStage: Record<number, boolean>;
  solved: boolean;
  solvedStage?: number;
  revealed: boolean;
};
```

## 25.3 Game Result

```ts
type GameResult = {
  puzzleId: string;
  puzzleNumber: number;
  solved: boolean;
  solvedStage?: number;
  solvedClipDuration?: number;
  totalGuesses: number;
  totalRepeatsUsed: number;
  resultLabel: string;
};
```

---

# 26. Public API

## 26.1 `GET /api/today`

Returns today’s published puzzle.

MVP can expose accepted answers to the client for client-side matching.

This is not cheat-proof, but acceptable for MVP.

Response:

```ts
type TodayPuzzleResponse = {
  id: string;
  date: string;
  puzzleNumber: number;
  previewUrl: string;
  previewStartSeconds: number;
  stageDurations: number[];
  canonicalAnswerEnglish: string;
  canonicalAnswerKorean?: string | null;
  acceptedAnswers: string[];
  songTitleEnglish: string;
  songTitleKorean?: string | null;
  artistName: string;
  albumArtUrl?: string | null;
};
```

Future version can move guess checking server-side.

---

# 27. Admin API

## 27.1 `GET /api/admin/music-search?term=&country=`

Searches music and returns possible tracks with preview URLs.

## 27.2 `GET /api/admin/puzzles`

Returns admin puzzle list.

## 27.3 `POST /api/admin/puzzles`

Creates puzzle.

## 27.4 `GET /api/admin/puzzles/:id`

Returns puzzle detail.

## 27.5 `PATCH /api/admin/puzzles/:id`

Updates puzzle.

## 27.6 `DELETE /api/admin/puzzles/:id`

Optional for MVP.

Prefer soft delete/archive.

---

# 28. Local Persistence

Use localStorage to remember today’s progress/result.

Key format:

```text
popped-result-{puzzleId}
```

or

```text
popped-result-{date}
```

Recommended:

```text
popped-result-{puzzleId}
```

This prevents accidental refresh replay.

Not cheat-proof, acceptable for MVP.

---

# 29. Analytics Events

Track simple events:

- `page_viewed`
- `game_started`
- `stage_played`
- `repeat_used`
- `guess_submitted`
- `guess_correct`
- `next_clue_clicked`
- `answer_revealed`
- `result_shared`
- `spoiler_hidden`
- `spoiler_shown`
- `reveal_preview_played`
- `audio_error`

Useful properties:

- puzzleId
- puzzleNumber
- stage
- solved
- guessesCount
- repeatsCount
- device/browser if available

---

# 30. Design Direction

## 30.1 Brand Voice

Clean and playful.

Not overly teasing.

Not dramatic.

Not childish.

## 30.2 Visual Direction

Suggested feeling:

**daily puzzle + studio timer + minimal music cue sheet**

## 30.3 UI Principles

- Mobile-first
- High readability
- Large tap targets
- Clear spacing
- Minimal color palette
- Album art only after reveal
- One subtle accent color
- Monospaced numerals for stage/time info
- Clean sans-serif for main text

## 30.4 Avoid

- Heavy gradients
- Neon K-pop stereotypes
- Overly flashy animations
- Too many emojis in core UI
- Complicated onboarding
- Desktop-first layouts

---

# 31. Accessibility Requirements

- Buttons need accessible labels
- Text contrast must be strong
- Input must be keyboard usable
- Audio errors must be visible as text
- Do not rely only on color for feedback
- Tap targets should be comfortable on mobile

---

# 32. Performance Requirements

- Fast first load
- Lightweight JavaScript
- No unnecessary heavy dependencies
- Audio should load quickly
- App should work on older iOS/Android browsers as much as reasonably possible
- Use simple CSS transitions

---

# 33. MVP Acceptance Criteria

MVP is ready when:

- User can open the site and play today’s puzzle on mobile
- Countdown works
- All seven audio stages work
- Repeat works once per stage
- Guess matching works for English and Korean aliases
- Result screen shows correct stats
- Spoiler hide/show works
- Share text works without revealing answer
- Failed users can play reveal preview from puzzle start point
- Admin can search music directly
- Admin can create/edit puzzles
- Admin can preview all stages
- Puzzle numbering starts at #1 for first real launch puzzle
- Test puzzles do not affect public numbering
- Missing/audio-error states are handled gracefully
- Site can be deployed without manual code edits for daily puzzles

---

# 34. Future Roadmap

## Phase 1 — MVP

Daily game + admin scheduler + direct music search.

## Phase 2 — Retention

- Streaks
- Better result labels
- Recent archive
- Improved share image/card
- Difficulty tags

## Phase 3 — Monetization

- Paid archive
- Themed packs
- Practice mode
- Membership

## Phase 4 — Community

- User accounts
- Leaderboards
- Friend challenges
- Multi-language UI
- More music categories if K-pop version works

---

# 35. Open Implementation Notes

These are not blockers.

1. Verify preview URL behavior across target countries.
2. Decide default search country: recommended `US` for international launch.
3. Allow country selector in admin if search results are bad.
4. Keep manual URL override.
5. Consider server-side guess checking later if cheating becomes a problem.
6. Consider adding Korean title lookup manually at first, because external metadata may not always provide clean Korean titles.

---

# 36. Codex Build Plan

The detailed Codex execution prompts should live in a separate document: **POPPED Codex Build Plan**.

This PRD should stay focused on product requirements, product behavior, data model, admin needs, technical constraints, and MVP acceptance criteria.

The Codex Build Plan should contain:

- CTO/master prompt
- Step-by-step implementation prompts
- Build order
- Acceptance criteria for each implementation slice
- Deployment readiness checklist

Keeping these separate makes the PRD easier to review while keeping the Codex prompts easier to copy and paste during implementation.

---

# 37. Suggested First Real Build Order

Recommended order:

1. Scaffold/inspect
2. Types/config
3. Static game UI
4. Answer matching
5. Game state
6. Result/share
7. Audio
8. LocalStorage
9. Supabase
10. Today API
11. Admin auth
12. Music search
13. Puzzle form
14. Stage preview
15. Puzzle numbering
16. Puzzle list
17. Mobile polish
18. Error QA
19. Analytics
20. Deploy

Do not skip straight to database/admin before the hardcoded game feels right.

The playable feeling is the product.

---

# 38. Founder/CTO Working Rule

The product should stay small enough to ship, but clean enough to grow.

When uncertain, choose the option that best protects this sentence:

> “I got today’s POPPED in 0.8 seconds.”

