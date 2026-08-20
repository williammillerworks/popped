# POPPED logo sound check

Implementation handoff for GitHub issue #6.

## Final creative decision

- Final sound: **v4 C — Digital-forward**
- Perceived phrase: `tok–tok / to-do-do-dok`
- Pitch contour: `C4–C4 / C4–D4–E4–F4` (`도–도 / 도–레–미–파`)
- Duration: `1.050 s`
- Format: 48 kHz, 16-bit, stereo PCM WAV
- Peak ceiling: approximately `-7 dBFS`
- Character: restrained digital pluck with a short wooden contact; tactile and soft, not glassy or toy-like
- Source: original procedural synthesis created for POPPED; no third-party samples

Audio asset:

`/audio/popped-logo-sound-check.wav`

## Letter assets

Render the six supplied transparent PNGs as six independent images. Keep their natural aspect ratios and align them on a shared visual baseline. Do not crop, recolor, redraw, or stretch them.

| Index | Letter | Asset | Source size |
| ---: | :---: | --- | ---: |
| 1 | P | `/images/popped-logo/letter-1-p.png` | 149 × 192 |
| 2 | O | `/images/popped-logo/letter-2-o.png` | 175 × 192 |
| 3 | P | `/images/popped-logo/letter-3-p.png` | 152 × 192 |
| 4 | P | `/images/popped-logo/letter-4-p.png` | 152 × 192 |
| 5 | E | `/images/popped-logo/letter-5-e.png` | 152 × 192 |
| 6 | D | `/images/popped-logo/letter-6-d.png` | 159 × 192 |

The PNGs were supplied by the project owner for use in POPPED.

## ARR Soundcheck control

Add a visible **Soundcheck** control near the upper-left area of ARR, following the supplied reference screenshot:

`docs/02-design/references/arr-soundcheck-button.png`

Use the supplied replay icon without redrawing it:

`/icons/soundcheck-replay.svg`

The reference SVG is 30 × 30 and uses the approved purple stroke `#D56EFC`.

### Hit area and structure

- Implement the icon and visible `Soundcheck` text as one semantic `<button type="button">`.
- The **entire icon-and-label row**, including its padding and the gap between icon and text, must be clickable/tappable. Do not attach the action only to the SVG or place separate controls around the icon and label.
- Use a minimum target size of `44 × 44 CSS px`; additional horizontal padding is encouraged so the text area is comfortably tappable.
- Keep the button background visually transparent in its resting state, consistent with the screenshot.
- Preserve a clear keyboard focus indicator and a restrained pressed/active state.
- Keep the visible label `Soundcheck` as shown. Because the text already names the action, do not add a conflicting accessible name.
- The icon is decorative inside the named button and should use `aria-hidden="true"`.
- Do not rotate continuously or add a decorative looping animation to the replay icon. A brief pressed response is sufficient; the meaningful replay feedback is the synchronized logo motion and sound.

### Activation behavior

Every Soundcheck activation must replay **both** parts of the experience from the beginning:

1. cancel any active letter animations and pending letter timers;
2. stop/reset the current sound-check audio to time zero;
3. restart the six-letter logo sequence from the first P;
4. replay `/audio/popped-logo-sound-check.wav` from the beginning.

Rapid repeated activations restart immediately and cleanly. They must never layer multiple audio instances, queue multiple sequences, or leave a letter away from its resting transform.

If the first automatic ARR playback was blocked by browser policy, pressing this user-initiated button should make a fresh audible playback attempt and restart the visual sequence. Do not show an autoplay warning before the player presses it.

## Audio and motion timeline

Use the audio file as the timing authority. The nominal hit onsets are:

| Letter | Sound | Onset |
| :---: | --- | ---: |
| P | 도 (C4) | 0 ms |
| O | 도 (C4) | 190 ms |
| P | 도 (C4) | 410 ms |
| P | 레 (D4) | 515 ms |
| E | 미 (E4) | 620 ms |
| D | 파 (F4) | 760 ms |

The third through sixth letters should read as the compact phrase `to-do-do-dok`, not four equally separated beats.

## Motion direction

Each letter reacts independently at its audio onset. The motion should feel like a small soft object popping upward, dipping a little below its resting position, and naturally returning: **upward pop → small downward “띠옹” → settle**.

Initial tuning target for each letter:

| Time from onset | `translateY` | Scale | Purpose |
| ---: | ---: | --- | --- |
| 0 ms | 0 px | `1` | resting state |
| 65–75 ms | -7 px | `scaleX(.985) scaleY(1.025)` | quick upward pop |
| 145–165 ms | +2 px | `scaleX(1.012) scaleY(.988)` | soft downward overshoot |
| 220–240 ms | 0 px | `1` | quiet settle |

For the final D only, `-8 px` and a `250–270 ms` settle are acceptable so the phrase closes clearly. Treat these as browser-tuning values, not a reason to make the motion larger.

Motion principles:

- Set `transform-origin` near the lower center, approximately `50% 82–88%`.
- Keep horizontal position and layout geometry fixed throughout.
- Prefer transform-only animation; do not animate layout properties.
- Avoid rotation, glow, particles, elastic multi-bounce, or a large cartoon squash.
- The six letters must not move as one group.
- The sequence should feel minimal at normal size and remain readable on mobile.
- A later letter may begin while the previous letter is settling; do not wait for each animation to finish.

Suggested easing starting points:

- Rise: `cubic-bezier(.2,.8,.25,1)`
- Dip and settle: `cubic-bezier(.22,.75,.25,1)`

Use Web Animations, CSS keyframes, or the project's existing motion approach. Tune by eye in the real ARR layout rather than introducing a new animation dependency solely for this sequence.

## Playback behavior

- Start the visual sequence from the actual audio playback start (`playing`) when playback succeeds.
- If autoplay is rejected, run the same visual timeline silently without showing an autoplay warning.
- Manual Sound check must restart the audio and all six animations from the beginning.
- A repeated activation must cancel active animations before restarting; never overlap or queue sequences.
- Keep the resting logo geometry identical before and after playback.
- Reuse the same component, asset, timing table, and audio file in onboarding.
- Do not interpret successful `play()` as proof that the device or browser tab is audible.

## Reduced motion

When `prefers-reduced-motion: reduce` is active, keep all six letter images stationary. Preserve explicit Sound check audio playback and accessible labeling; the user must not need motion to understand whether the control was activated.

## Accessibility

- The decorative letter images should not be announced separately. Give the combined logo one useful accessible name, such as `POPPED`.
- The replay control must have a stable accessible label such as `Sound check`.
- Support pointer, touch, keyboard activation, and visible focus.
- Keep icon, label, padding, and their internal gap inside the same button hit area.

## Implementation checklist

- [ ] Build one reusable six-letter logo component from the supplied PNGs.
- [ ] Keep source aspect ratios and a stable shared baseline.
- [ ] Preload or otherwise prepare the 1.05-second WAV without blocking ARR indefinitely.
- [ ] Synchronize letter triggers to the onset table above.
- [ ] Implement pop, small downward overshoot, and single settle.
- [ ] Tune at phone and desktop sizes without exceeding the restrained motion range.
- [ ] Cancel and restart cleanly on repeated Sound check activation.
- [ ] Add the upper-left ARR Soundcheck button using the supplied icon and screenshot.
- [ ] Make the complete icon-and-text row a single comfortable touch target of at least 44 × 44 CSS px.
- [ ] Confirm that pointer, touch, Enter, and Space all restart sound and logo motion together.
- [ ] Give the button visible hover/pressed/focus feedback without introducing a looping icon animation.
- [ ] Handle rejected playback promises without an unhandled error.
- [ ] Preserve silent visual playback when autoplay is rejected.
- [ ] Add the stationary reduced-motion state.
- [ ] Reuse the implementation in onboarding.
- [ ] Verify current Safari, Chrome, Firefox, and representative mobile browsers.

## Integrity references

SHA-256 values for confirming the selected source assets:

```text
ba2ff4c3556d4e696a14b706b4a269c174332c5f1639235ee83f66dff9a6743f  popped-logo-sound-check.wav
f082b565b07eec40a00f53d9b897ce47f6894723e09d676dafc8c8aba1026823  letter-1-p.png
da1a059392266cfb350a240cfadbfb668b2798d3e6a10b82f9ca8e90c16c7344  letter-2-o.png
0138772f03446c67728ef07557cf7fe73bd754ae58fe78787350080e096f421c  letter-3-p.png
46a1921a5d5454c2c5a540c0bf2aea39dc4e4d2a00744872bf5ccff4b5c2c8e5  letter-4-p.png
d480de02baa9ce0f3179f31940909f140236293a6000b3b3c2a8787f35e98e36  letter-5-e.png
f3bb5c091f2b9eab6ad640e13cec6b75aa925661bad60d1be191710df734bbfd  letter-6-d.png
be60c22a63c86fbf0e2691e8e9936761fbd6b46cbb246f8b618f8f87ea70d2a1  soundcheck-replay.svg
ea65c0857c3f458c7ab8bd8322e7a0d57fcea87342916f9fa16cfb52283d4a0f  arr-soundcheck-button.png
```
