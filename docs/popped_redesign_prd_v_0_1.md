# POPPED Redesign PRD v0.1

Recommended repo path:

```text
/docs/POPPED_Redesign_PRD_v0_1.md
```

## Purpose

This document defines POPPED’s visual identity direction for the MVP redesign.

It should be treated as the design source of truth alongside the main product PRD:

```text
/docs/POPPED_PRD_v0_2.md
```

The main PRD defines product behavior.

This redesign PRD defines visual identity, UI direction, and design constraints.

---

# 1. Visual Identity Thesis

POPPED is a minimal daily K-pop guessing game with a clean black-and-white interface, touched by subtle translucent, iridescent, and bubble-like visual details.

The product should feel calm and intelligent like a daily puzzle, but still carry the light pressure, shine, and hidden excitement of K-pop.

> **Surface Tension** — a clean surface hides a bright pop underneath.

The user should feel that the answer, album art, and K-pop energy are waiting under the interface until the reveal moment.

---

# 2. Design Positioning

## 2.1 NYT Games Gives the Skeleton

POPPED should inherit the clarity of a good daily puzzle.

Required qualities:

- Stage number should be obvious
- Guess input should be obvious
- The rhythm of play should be obvious
- The interface should not decorate over the game
- Interaction animation should be minimal but effective

## 2.2 POPPED Adds the Surface Tension

POPPED should not feel like a newspaper game clone.

It needs hidden K-pop energy through:

- Subtle translucent surfaces
- Tiny iridescent light reflections
- Bubble/pressure motifs
- Slight gloss at edges
- Reveal-focused motion
- Album art as the first major color moment

## 2.3 Duolingo Gives the Retention Lesson, Not the Look

Borrow:

- Small playful feedback
- Strong recognizability
- Streak energy later

Avoid:

- Mascot-led identity
- Cartoon world
- Toy-app feeling
- Overly loud UI personality

POPPED should have personality through materials and motion, not a character.

---

# 3. What to Avoid

Do not translate “K-pop guessing game” into obvious fandom clichés.

Avoid:

- Pink-first gradients
- Hearts
- Neon
- Idol silhouettes
- Sparkles everywhere
- Album-wall collage
- Fan-edit visual language
- Heavy glassmorphism
- Overly cute bubbly UI everywhere
- Pixel-art interface as the main system
- Character/mascot identity

Preferred translation:

> K-pop energy should come from anticipation, polish, compression, and reveal.

---

# 4. Visual System Direction

## 4.1 Before Reveal / After Reveal Rule

This is the clearest visual rule in the system.

Before reveal:

- Warm off-white background
- Near-black type
- Low color
- Subtle translucent, iridescent, and bubble-like details
- The interface stays calm so the audio clue remains the focus

After reveal:

- Album art becomes the first major color object
- Result card can carry slightly stronger visual energy
- The UI should feel like the hidden pop has finally surfaced

This makes the reveal feel earned.

## 4.2 Background

Use warm off-white, not pure white.

The background should feel clean but not sterile.

Example token candidates:

```css
--color-bg: #f8f4ec;
--color-surface: #fffdf8;
--color-text: #111111;
--color-muted: #6f6a61;
--color-border: rgba(17, 17, 17, 0.12);
```

Exact values can be adjusted during implementation.

## 4.3 Typography

Use clean, readable typography.

Preferred structure:

- Clean sans-serif for main UI
- Monospaced numerals for stage, duration, puzzle number, and result stats
- Avoid decorative display fonts for MVP UI

The logo/wordmark can be explored later, but do not block redesign on logo creation.

## 4.4 Layout

The game should feel centered, quiet, and focused.

- Mobile-first
- Generous spacing
- Strong hierarchy
- One obvious primary action per state
- Game content should remain the center
- Decorative elements should stay behind or around the gameplay, not on top of it

## 4.5 Material Accent

Use CSS-only accents for MVP.

No heavy image textures unless explicitly approved later.

Acceptable accents:

- Subtle iridescent radial gradient
- Soft translucent highlight
- Thin glossy edge on a card
- Bubble-dot stage progress motif
- Light reflection blur behind the main card
- Tiny shimmer on reveal only

Do not create a full glassmorphism UI.

The main UI should remain mostly flat.

## 4.6 Color Rule

Before reveal:

- Mostly warm off-white
- Near-black text
- Muted gray/brown secondary text
- Very subtle iridescent accents

After reveal:

- Album art becomes the main color object
- Result card may allow slightly stronger visual energy

This makes the reveal feel earned.

---

# 5. Interaction and Motion Direction

Motion should communicate rhythm and pressure, not decoration.

## 5.1 Countdown

Countdown should feel like pressure building.

- Minimal scale or opacity transition
- No dramatic bounce
- No confetti

## 5.2 Stage Progress

Stage progress can use bubble-like dots or pressure cells.

- Filled dot/cell indicates current or completed progress
- Should be readable at a glance
- Should not look childish

## 5.3 Repeat and Next Clue

Buttons should feel utilitarian and clear.

- Repeat is secondary
- Next Clue is clear but not overly loud
- Submit/Guess is primary

## 5.4 Correct Reveal

Correct reveal should feel like the surface opens.

Possible effects:

- Very small shimmer
- Slight card lift
- Album art fade-in
- Result stats appear cleanly

Avoid:

- Confetti explosion
- Overly playful cartoon animation
- Big gradient burst

## 5.5 Failed Reveal

Failed reveal should not feel punishing.

It should feel calm:

- “Not Today”
- Reveal title/artist/art
- Play Preview button

---

# 6. Component-Level Redesign Requirements

## 6.1 App Shell

- Warm off-white background
- Centered game area
- Subtle CSS-only background accents
- No heavy decorative assets

## 6.2 Game Card

- Mostly flat surface
- Slight border
- Slight shadow or ambient lift
- Optional subtle glossy/iridescent edge
- Rounded corners, but not overly pill-like

## 6.3 Logo / Header

For MVP:

- Use text wordmark “POPPED”
- Keep it clean and confident
- Can include a tiny bubble/pressure mark near it if simple
- Do not spend too much time creating a full logo system yet

Future logo layers:

- Wordmark
- P mark
- Design mark/motif

## 6.4 Stage Indicator

Should be obvious and iconic.

Preferred options:

- Seven bubble dots
- Seven small pressure cells
- Minimal segmented line

Must show:

- Current stage
- Total stages
- Current duration

## 6.5 Guess Input

Input must be extremely obvious.

- Strong readable border
- Clear placeholder
- Comfortable mobile height
- Visible focus state; after the game starts, the input may autofocus when it does not create mobile keyboard friction
- Submit button nearby

Do not hide input inside decorative surfaces.

## 6.6 Buttons

Button hierarchy:

1. Primary: Start / Submit / Reveal Answer
2. Secondary: Next Clue
3. Tertiary: Repeat / Share / Hide Spoiler

Buttons should be clean and tactile.

Avoid overly bubbly button shapes.

## 6.7 Result Card

The result card should be screenshot-worthy.

It should feel like a clean collectible object, almost like the back of a photocard, but not literal idol branding.

Must include:

- Result label
- Puzzle number
- Solved duration or failed state
- Guess count
- Repeat count
- Spoiler hide/show control
- Album art after reveal
- Share button
- Play Preview button

## 6.8 Spoiler Hide State

When spoiler is hidden:

- Hide title
- Hide artist
- Hide Korean title
- Hide or blur album art
- Keep stats visible

The hidden state should still look intentional and shareable.

---

# 7. Design Tokens

Codex should create or update design tokens in the existing styling system.

Possible tokens:

```css
:root {
  --popped-bg: #f8f4ec;
  --popped-surface: #fffdf8;
  --popped-text: #111111;
  --popped-muted: #6f6a61;
  --popped-border: rgba(17, 17, 17, 0.12);
  --popped-border-strong: rgba(17, 17, 17, 0.24);
  --popped-iridescent-a: rgba(185, 226, 255, 0.55);
  --popped-iridescent-b: rgba(255, 198, 234, 0.45);
  --popped-iridescent-c: rgba(229, 255, 194, 0.35);
  --popped-shadow: 0 18px 60px rgba(17, 17, 17, 0.08);
}
```

These are starting points, not fixed brand law.

---

# 8. CSS Effect Guidance

## 8.1 Iridescent Glow

Use subtle layered radial gradients.

Example direction:

```css
.popped-glow {
  background:
    radial-gradient(circle at 20% 20%, rgba(185, 226, 255, 0.32), transparent 28%),
    radial-gradient(circle at 80% 10%, rgba(255, 198, 234, 0.26), transparent 30%),
    radial-gradient(circle at 50% 90%, rgba(229, 255, 194, 0.22), transparent 34%);
}
```

Keep opacity low.

Never place important text directly on top of busy gradients.

## 8.2 Bubble Motif

Use simple CSS circles/dots.

Possible uses:

- Stage progress
- Background texture at very low opacity
- Logo-adjacent accent

Do not fill the screen with bubbles.

## 8.3 Gloss Edge

Use pseudo-elements or border gradients sparingly.

The effect should be barely noticeable.

---

# 9. Redesign Rules

When implementing the redesign, follow these rules:

- Do not change core game logic.
- Do not change answer matching.
- Do not change audio playback behavior unless explicitly asked.
- Do not change API behavior.
- Do not redesign admin in the first pass unless explicitly asked.
- Focus on public game UI first.
- Use CSS/Tailwind, not heavy image assets.
- Do not add large design/animation libraries.
- Keep accessibility and readability above aesthetics.
- Test on mobile viewport.
- Keep result/share states spoiler-safe.

---

# 10. Design QA Checklist

Use this after the redesign.

## 10.1 Clarity

- Can I immediately tell what stage I am on?
- Can I immediately find the guess input?
- Is the primary action obvious?
- Is the stage rhythm easy to understand?

## 10.2 Surface Tension

- Does the interface feel calm and clean?
- Is there a subtle sense of hidden energy?
- Are bubble/iridescent details present but restrained?
- Does the reveal feel more colorful than the guessing state?

## 10.3 Avoidance

- Does it avoid K-pop clichés?
- Does it avoid heavy glassmorphism?
- Does it avoid toy/cartoon energy?
- Does it avoid looking like a generic white SaaS app?

## 10.4 Mobile

- Is it comfortable on a phone?
- Are buttons large enough?
- Is the input easy to use?
- Does the result card screenshot well?

## 10.5 Engineering

- Did game logic remain unchanged?
- Did audio behavior remain unchanged?
- Did answer matching remain unchanged?
- Did share behavior remain spoiler-safe?

---

# 11. Final Redesign Principle

When uncertain, choose the option that makes POPPED feel like:

> A calm daily puzzle surface with hidden K-pop energy waiting to pop underneath.

The product should be quiet before the reveal and more colorful after the reveal.

