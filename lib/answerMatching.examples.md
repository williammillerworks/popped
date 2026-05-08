# Answer Matching Examples

POPPED answer matching is song-title-only. Artist names should not be included
in `acceptedAnswers` unless an admin intentionally wants them to count.

```ts
normalizeAnswer("  LOVE---DIVE!! ") === "love dive";
compactNormalizeAnswer("LOVE DIVE") === "lovedive";

isCorrectGuess("LOVE DIVE", ["love dive"]) === true;
isCorrectGuess("love dive", ["LOVE DIVE"]) === true;
isCorrectGuess("love-dive", ["LOVE DIVE"]) === true;
isCorrectGuess("lovedive", ["LOVE DIVE"]) === true;

isCorrectGuess("러브다이브", ["러브 다이브"]) === true;
isCorrectGuess("러브 다이브", ["러브다이브"]) === true;

isCorrectGuess("IVE", ["LOVE DIVE", "러브다이브"]) === false;
```
