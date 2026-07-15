# POPPED Redesign Codex Build Plan v0.1

Recommended repo path:

```text
/docs/POPPED_Redesign_Codex_Build_Plan_v0_1.md
```

## Purpose

This document contains the step-by-step Codex prompts for applying POPPED’s visual redesign.

Use together with:

```text
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md
```

The main PRD defines product behavior.

The redesign PRD defines visual identity.

This build plan defines implementation sequence.

---

# 1. How to Use This Plan

Do not ask Codex to redesign the entire product in one pass.

Use the prompts step by step.

After each Codex task:

1. Review the diff.
2. Run the app locally.
3. Check mobile viewport.
4. Confirm game logic still works.
5. Commit if the slice is good.
6. Move to the next prompt.

Recommended working style:

```text
one prompt → one visual slice → review → run → mobile check → commit
```

---

# 2. Initial Redesign Prompt — Audit + Tokens + App Shell

Paste this into Codex first for the redesign.

```text
We are now applying POPPED’s refined visual identity to the public game UI.

Before coding, read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Treat the main PRD as the source of truth for product behavior.
Treat the redesign PRD as the source of truth for visual identity.

Do not change core game logic, answer matching, audio playback behavior, API behavior, or admin behavior unless required for safe styling integration.

Your task in this first redesign pass is intentionally limited:

1. Audit the current public game UI files.
2. Add or refine foundational design tokens.
3. Redesign only the public app shell/background.
4. Redesign only the main game card/container.

Do not redesign the stage indicator, controls, result card, spoiler state, or motion in this first pass unless a tiny adjustment is required to keep the shell/card coherent. Those will be handled in later prompts.

Visual identity:

POPPED is a minimal daily K-pop guessing game with a clean black-and-white interface, touched by subtle translucent, iridescent, and bubble-like visual details. The product should feel calm and intelligent like a daily puzzle, but still carry the light pressure, shine, and hidden excitement of K-pop.

Internal design concept:
Surface Tension — a clean surface hides a bright pop underneath.

Design principles:
- NYT Games gives us the skeleton: clarity, obvious stage number, obvious guess input, obvious rhythm of play, minimal but effective interaction animation.
- POPPED adds surface tension: subtle translucent surfaces, tiny iridescent light reflections, bubble/pressure motifs, reveal-focused motion.
- Borrow from Duolingo only small playful feedback, strong recognizability, and future streak energy. Do not create a mascot/cartoon world.

Avoid:
- Pink-first gradients
- Hearts
- Neon
- Idol silhouettes
- Sparkles everywhere
- Album-wall collage
- Fan-edit visuals
- Heavy glassmorphism
- Full pixel-art interface
- Overly cute bubbly UI everywhere
- Mascot/character identity

Implementation direction for this first pass:
- Use warm off-white background, not pure white.
- Use near-black text.
- Keep the main UI mostly flat.
- Add only selective translucent/gloss/iridescent CSS effects.
- Use CSS/Tailwind only; no heavy image textures or large animation libraries.
- Keep decorative effects behind or around gameplay, not on top of it.
- Keep input, buttons, stage number, and stage progress readable even if they are not fully redesigned yet.

Expected work:
1. Audit current public game UI components and identify the files involved.
2. Add or refine design tokens for POPPED background, surface, text, muted text, border, shadow, and subtle iridescent accents.
3. Apply warm off-white app background.
4. Add a subtle CSS-only iridescent/background glow or surface detail.
5. Redesign the main game card/container with a mostly flat surface, restrained border, soft shadow, and optional subtle glossy edge.
6. Preserve all existing game states and behavior.

Acceptance criteria:
- Public game shell feels warm, clean, minimal, and more distinctive.
- Main game card remains highly readable.
- Decorative effects do not interfere with gameplay.
- No idol/K-pop cliché visuals are introduced.
- No heavy glassmorphism.
- No game logic changes.
- No admin redesign.
- Mobile viewport still looks good.
- TypeScript/lint/build still pass if available.

Before coding:
- Tell me which files you expect to touch.
- Tell me how you will avoid changing game logic.
- Briefly describe the visual changes you will make in this first pass.

After coding:
- Summarize changed files.
- Tell me how to run and verify locally.
- Tell me what to check on mobile.
```

---

# 3. Step-by-Step Redesign Prompts

## Prompt V1 — Visual Audit Only

Use this if you want Codex to review before touching code.

```text
Audit the current POPPED public game UI against the redesign PRD.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not edit code yet.

Return:
1. Current UI strengths
2. Current UI mismatches
3. Files/components likely involved
4. Recommended redesign sequence
5. Risks to avoid, especially game logic regressions
```

---

## Prompt V2 — Add Design Tokens Only

```text
Add POPPED visual identity tokens without redesigning components yet.

Read:
/docs/POPPED_Redesign_PRD_v0_1.md

Do not change game logic.

Create or update tokens for:
- warm off-white background
- near-black text
- warm surface
- muted text
- subtle border
- stronger border
- subtle iridescent accent colors
- soft shadow

Use the existing styling approach in the repo.

If Tailwind config is used, extend it cleanly.
If CSS variables are simpler, use CSS variables.
Do not add heavy dependencies.

Acceptance criteria:
- Tokens exist and compile.
- Existing UI still works.
- No visual redesign beyond safe token availability.
- No game logic changes.
```

---

## Prompt V3 — Redesign App Shell and Game Card

```text
Redesign only the public game app shell and main game card using POPPED’s Surface Tension identity.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not change game logic.
Do not redesign admin.

Apply:
- warm off-white background
- centered mobile-first layout
- subtle CSS-only iridescent background glow
- mostly flat game card
- slight border/shadow
- optional subtle glossy edge

Avoid:
- heavy glassmorphism
- neon
- hearts
- idol imagery
- loud gradients

Acceptance criteria:
- Public game feels cleaner and more distinctive.
- Main game card remains readable.
- Decorative accents stay behind/around gameplay.
- Mobile viewport works.
- No game logic changes.
```

---

## Prompt V4 — Redesign Stage Indicator and Controls

```text
Redesign the stage indicator, duration display, input, and controls.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not change game logic.

Design direction:
- Stage number should be obvious.
- Duration should use clear mono-style numerals if available.
- Stage progress should feel like subtle bubble/pressure cells.
- Guess input should be highly obvious and comfortable on mobile.
- Submit is primary.
- Next Clue is secondary.
- Repeat is tertiary.

Acceptance criteria:
- Stage 1–7 progress is clear.
- Current stage is obvious.
- Guess input is obvious.
- Button hierarchy is clear.
- Repeat still disables correctly after use.
- No game logic changes.
```

---

## Prompt V5 — Redesign Result Card and Spoiler State

```text
Redesign the result card and spoiler-hidden state.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not change scoring or share logic.

Design direction:
- Result card should feel screenshot-worthy.
- It should feel like a clean collectible object, almost like the back of a photocard, but not literal idol branding.
- Album art appears only after reveal.
- Album art should become the first major color object.
- Spoiler-hidden state should hide title, artist, Korean title, and hide or blur album art while keeping stats visible.
- Share text must remain spoiler-safe.

Acceptance criteria:
- Solved result looks polished.
- Failed result looks calm, not punishing.
- Spoiler hide/show is obvious but small.
- Hidden state is screenshot-friendly.
- Share behavior is unchanged.
- No game logic changes.
```

---

## Prompt V6 — Minimal Motion Polish

```text
Add minimal interaction/motion polish to the public game UI.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not add heavy animation libraries.
Do not change game logic.

Motion direction:
- Countdown feels like pressure building.
- Stage changes feel crisp.
- Correct reveal feels like the surface opens.
- Album art fades in cleanly.
- No confetti explosion.
- No dramatic bounce.
- No cartoon effects.

Use CSS transitions/animations only unless the project already has a lightweight motion setup.

Acceptance criteria:
- Motion feels minimal and effective.
- UI remains readable.
- No performance issues.
- No game logic changes.
```

---

## Prompt V7 — Mobile and Accessibility QA

```text
Run a mobile and accessibility QA pass on the redesigned public game UI.

Read:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Check:
- Mobile width layout
- Button tap targets
- Input readability
- Contrast
- Focus states
- Reduced motion friendliness if relevant
- Audio error visibility
- Result card screenshot quality
- Spoiler-hidden state clarity

Fix only styling/accessibility issues.
Do not change game logic.
Do not redesign admin.

Acceptance criteria:
- Public game is usable on mobile.
- Text is readable.
- Buttons are easy to tap.
- Focus states are visible.
- Decorative effects do not reduce contrast.
- TypeScript/lint/build pass if available.
```

---

# 4. Redesign Review Prompt

Use this after the redesign pass.

```text
Review the current POPPED public game UI against:
/docs/POPPED_PRD_v0_2.md
/docs/POPPED_Redesign_PRD_v0_1.md

Do not edit code yet.

Check:
- Does the UI follow the Surface Tension visual identity?
- Is the interface clear like a daily puzzle?
- Are the iridescent/bubble details subtle and restrained?
- Does it avoid K-pop clichés?
- Is the stage number obvious?
- Is the guess input obvious?
- Is the primary action obvious?
- Does album art become the first major color object after reveal?
- Does the spoiler-hidden state remain shareable?
- Did any game logic, answer matching, audio behavior, or share behavior change accidentally?

Return:
1. Must-fix issues
2. Important improvements
3. Nice-to-have polish
4. Recommended next prompt
```

---

# 5. Final Design Rule for Codex

When uncertain, choose the option that makes POPPED feel like:

> A calm daily puzzle surface with hidden K-pop energy waiting to pop underneath.

The product should be quiet before the reveal and more colorful after the reveal.

