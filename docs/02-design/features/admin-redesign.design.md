# admin-redesign - Design Document

> Version: 1.0.0 | Date: 2026-08-19 | Status: Approved
> Level: Dynamic | Plan: `docs/01-plan/features/admin-redesign.plan.md`

---

## 1. Overview

### 1.1 Purpose

Define an admin-only visual and component system for issue #12. The design
changes presentation, hierarchy, responsive composition, and accessible states;
it does not change server actions, data contracts, authorization, or audio
behavior.

### 1.2 Design Goals

- Quiet, neutral, information-dense UI informed by Linear and shadcn/ui.
- One obvious primary action per view with restrained secondary actions.
- Fast scanning through type hierarchy, tabular numbers, structured rows, and
  status signals that combine color, icon/shape, and text.
- Persistent labels and contextual help for long editorial forms.
- Visible keyboard focus and minimum 44px interactive targets.
- Small local primitives that compose through children and standard DOM props.

## 2. Architecture

### 2.1 Styling Strategy

Keep Tailwind v4 and the existing global stylesheet. Do not install shadcn/ui,
Radix, or another component library. Add scoped semantic OKLCH tokens under
`.admin-root`, expose them to Tailwind through the existing `@theme inline`
block, and consume them through Tailwind utilities.

The admin palette uses a cool neutral hue around 265° and a restrained violet
accent around 285°. Success uses green, warning uses amber, and destructive uses
red so primary and outcome semantics cannot be confused.

| Token | Light value / behavior | Role |
|---|---|---|
| `--admin-canvas` | `oklch(0.975 0.004 265)` | Page background |
| `--admin-sidebar` | `oklch(0.225 0.012 265)` | Protected navigation |
| `--admin-surface` | `oklch(0.995 0.002 265)` | Main panels |
| `--admin-surface-subtle` | `oklch(0.955 0.006 265)` | Inset groups/rows |
| `--admin-border` | neutral with 10% alpha | Separators and fields |
| `--admin-text` | `oklch(0.22 0.012 265)` | Primary text |
| `--admin-text-muted` | `oklch(0.46 0.018 265)` | Secondary text |
| `--admin-accent` | `oklch(0.58 0.19 285)` | Primary actions and active nav |
| `--admin-destructive` | `oklch(0.55 0.205 27)` | Errors/destructive meaning |
| `--admin-focus` | `oklch(0.65 0.18 285)` | Focus-visible outline |
| `--admin-radius-*` | 8/12/16/20px | Nested radius system |
| `--admin-shadow-raised` | 3-layer translucent stack | Raised panels/menus |

Hover colors derive with `color-mix(in oklch, …)`; new raw hex/HSL values are
not permitted. Cards use layered shadow tokens for depth while tables, inputs,
and row boundaries keep real alpha separators.

### 2.2 Typography

- Use the already-loaded Inter variable for admin surfaces with system fallbacks.
- Scale: 12px metadata, 14px dense UI, 16px body and all mobile fields,
  20/24/32px headings.
- Display leading is 1.1–1.2; body leading is 1.5–1.6.
- Headings use balanced wrapping; short descriptions use pretty wrapping.
- Dates, counts, puzzle numbers, and timestamps use tabular numerals.
- `font-synthesis: none` and root smoothing apply in the admin scope.

### 2.3 Component Design

`components/admin/admin-ui.tsx` contains only repeated compositional pieces:

- `AdminShell`: sidebar/topbar frame; children provide page content.
- `AdminPageHeader`: eyebrow, title, description, optional action slot.
- `AdminPanel`: header/content composition via children and `className` escape.
- `AdminAlert`: `info | success | warning | error` semantic variants.
- `AdminIcon`: one local outline icon vocabulary.

Components forward semantic HTML attributes where they wrap DOM nodes. Simple
content remains children rather than configuration objects. Existing complex
`PuzzleForm` and `AdminAudioTimestampEditor` retain their behavioral APIs.

### 2.4 Route Composition

```text
src/app/admin/layout.tsx
  .admin-root + skip link
  /admin/page.tsx
    signed out -> focused login surface
    signed in  -> AdminShell landing
  /admin/puzzles/layout.tsx
    existing requireAdminSession()
    children
  /admin/puzzles/page.tsx
    AdminShell -> summary -> schedule alert -> responsive list/table
  /admin/puzzles/new/page.tsx
    AdminShell -> header -> PuzzleForm
  /admin/puzzles/[id]/edit/page.tsx
    AdminShell -> header/feedback -> PuzzleForm
```

Desktop navigation is a narrow persistent sidebar. Below the content-driven
breakpoint it becomes a compact header with horizontal primary navigation.
Content caps near 1200px and keeps DOM order aligned with visual order.

### 2.5 Data Flow

No data-flow changes:

1. Server pages call existing session and Supabase helpers.
2. Protected layout and every server action continue to authorize independently.
3. Server pages pass serializable puzzle/editor data to `PuzzleForm`.
4. `PuzzleForm` continues to use `useActionState` for validated mutations.
5. Music search continues through `/api/admin/music-search`.
6. Timestamp editor continues to own browser audio state and reports range
   validity to the parent form.

## 3. Data Model

No schema or relationship changes. Existing `Puzzle`, `PuzzleEditor`, duration
preset, form state, and normalized music-search result types remain the source
of truth. Field names and serialized `FormData` keys stay unchanged.

## 4. API Specification

No endpoint or request/response changes.

- `GET /api/admin/music-search?term={query}&country={code}` remains protected
  and returns normalized music search results.
- Existing create/update server actions preserve parsing, numbering,
  revalidation, redirects, and Supabase error handling.
- Sign-in/sign-out actions preserve cookie and allowlist behavior.

## 5. Interaction and State Design

### 5.1 Forms

- Every field keeps a persistent label and correct native input type.
- Mobile inputs/selects/textareas compute to at least 16px.
- Focus uses a 2px visible outline with offset; hover and error borders remain
  distinct. Error states include border, icon, and nearby message text.
- Validation remains server-driven on submit. Once returned, error messages are
  linked with `aria-describedby` where local field components render them.
- Search is a real form; search controls disable and say “Searching…” while busy.
- Save disables and says “Creating puzzle…” or “Saving changes…” while pending.
- The save bar is sticky in-flow near the viewport bottom and includes safe-area
  padding without covering form content.

### 5.2 Lists and Status

- Desktop uses a semantic table with right/center alignment where appropriate.
- Narrow screens use structured articles with labeled metadata; no horizontal
  scroll is required for core actions.
- Truncated song/artist text exposes the full value with `title`.
- Status and test/counting states always include readable text and distinct
  shape/tone, not color alone.
- Empty and failure states explain the condition and offer a concrete next step.

### 5.3 Motion

Only 150ms color, border, shadow, and transform feedback is used. Buttons depress
slightly on active. No page entrance choreography is added. Reduced-motion users
receive no transitions or transforms in the admin scope.

## 6. Implementation Plan

### 6.1 Files

- Add `src/app/admin/layout.tsx` and `src/app/admin/puzzles/loading.tsx`.
- Add `components/admin/admin-ui.tsx`.
- Update `src/app/globals.css` with admin-scoped tokens and Tailwind mappings.
- Update all admin pages plus `PuzzleForm` and `AdminAudioTimestampEditor`.
- Do not modify API routes, Supabase helpers, auth helpers, puzzle parsing, or
  public game components.

### 6.2 Order

1. Add semantic tokens and shared UI primitives.
2. Apply root/admin shell to login and protected pages.
3. Rebuild the overview as responsive table/cards.
4. Reorganize long-form sections and sticky save bar without changing fields.
5. Restyle search results and timestamp editor states.
6. Add loading skeleton, then run static and browser verification.

## 7. Test Plan

### 7.1 Automated

- Existing form-parser, admin-auth, puzzle-numbering, music-search, and audio
  validation tests remain green.
- ESLint has no new warnings/errors.
- Production build completes with Next.js 16.2.5.

### 7.2 Browser

- Signed-out login: labels, Enter submit, config-disabled, invalid-credentials.
- Signed-in landing/list: navigation, sign out, summary, missing dates, dense rows.
- Create/edit: search loading/error/empty/results, prefill, field validation,
  sticky save, created-success feedback.
- Timestamp: no URL, loading, ready, invalid range, failed load, stage/reveal play.
- Viewports: narrow phone, tablet, desktop, and desktop at 200% zoom.
- Input methods: keyboard-only tab order and visible focus; pointer active states.

## 8. Security Considerations

- Keep `requireAdminSession()` in the protected route layout and mutation/search
  boundaries; visual shell components never imply authorization.
- Do not move service-role credentials, puzzle data access, or auth logic client-side.
- Preserve server-only environment-variable diagnostics without printing values.
- Do not add analytics around admin form values or music-search responses.
