# admin-redesign - Plan Document

> Version: 1.0.0 | Date: 2026-08-19 | Status: Approved
> Level: Dynamic | Source: GitHub issue #12

---

## 1. Overview

### 1.1 Purpose

Redesign the complete song-admin journey as a quiet, dense, modern operational
tool while preserving all current authentication, puzzle, scheduling, music
search, validation, numbering, and audio-preview behavior.

### 1.2 Background

The existing admin inherited the public product's warm brown, highly styled
visual language. It works, but dense lists and long editorial forms are harder
to scan than they should be. Issue #12 authorizes an admin-only visual system
informed by Linear and shadcn/ui patterns.

## 2. Goals

### 2.1 Primary Goals

- [ ] Give `/admin`, `/admin/puzzles`, create, and edit views one coherent shell.
- [ ] Improve scan speed for puzzle status, schedule gaps, test/public state,
  numbering, dates, and next actions.
- [ ] Group long-form editing into understandable sections with persistent
  labels, contextual help, field-level errors, and a discoverable save action.
- [ ] Make music search and timestamp audition clear in empty, loading, success,
  invalid, unavailable, and failure states.
- [ ] Meet keyboard, focus, contrast, zoom, screen-reader, and narrow-screen
  requirements without decorative motion.

### 2.2 Non-Goals

- No public Arrival, Gameplay, or Result styling changes.
- No database, API contract, authentication, allowlist, numbering, validation,
  scheduling, music-search, or audio-playback behavior changes.
- No player/member administration and no new admin data in client analytics.
- No full shadcn/ui or other component-library dependency.

## 3. Scope

### 3.1 In Scope

- Admin login and authenticated landing state.
- Shared protected admin shell and navigation.
- Puzzle overview, summaries, missing schedule dates, responsive records.
- New/edit page headers, feedback, `PuzzleForm`, and audio timestamp editor.
- Shared local admin primitives where they remove repetition.
- Admin-scoped design tokens and responsive, loading, empty, error, success,
  disabled, hover, active, and focus-visible states.

### 3.2 Out of Scope

- Backend migrations, Supabase policy changes, and server-action semantics.
- New puzzle filtering, pagination, bulk actions, deletion, or publishing flows.
- Global/public theme replacement.

## 4. Implementation Approach

Use the existing Tailwind v4 setup and local React components. Reproduce the
useful shadcn interaction patterns locally instead of adding a component
dependency: semantic variants, restrained surfaces, clear form states, and
composable shell/card primitives. This keeps the bundle and dependency surface
unchanged while meeting the consistency goal.

## 5. Success Criteria

- [ ] All issue #12 routes and components use one neutral admin visual system.
- [ ] Existing admin operations and protections remain unchanged.
- [ ] Dense real-world list rows remain scannable at desktop and narrow widths.
- [ ] Inputs remain at least 16px on touch widths and have associated labels.
- [ ] Focus indicators, inline field errors, loading text, disabled styles, and
  status semantics are visible without relying on color alone.
- [ ] Save remains visible during long edits and cannot be double-submitted.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] Manual browser checks cover desktop, narrow screen, 200% zoom, keyboard,
  login error, list empty/error, form validation, and audio states.

## 6. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|---|---:|---:|---|
| Visual refactor changes behavior | High | Low | Preserve actions, field names, values, and data functions; keep changes in markup/styles |
| Shared shell duplicates authentication | High | Low | Keep protection in the existing route layout and server actions |
| Sticky save obscures content | Medium | Medium | Use in-flow sticky footer with safe-area padding and zoom/narrow checks |
| Dense table fails on mobile | Medium | Medium | Switch to semantic structured cards below the content-driven breakpoint |
| Admin tokens leak into public UI | Medium | Low | Scope all variables and styles under `.admin-root` |

## 7. References

- GitHub issue #12: `https://github.com/williammillerworks/popped/issues/12`
- `docs/POPPED_PRD_v0_2.md`
- `docs/ADMIN_AUTH.md`
- Next.js 16.2.5 bundled App Router, Server/Client Components, Forms, and CSS docs
- Requested design-foundations, typography, color, surfaces,
  component-design, and forms-and-inputs skills
