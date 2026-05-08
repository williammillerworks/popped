export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactNormalizeAnswer(input: string): string {
  return normalizeAnswer(input).replace(/\s/g, "");
}

export function isCorrectGuess(
  guess: string,
  acceptedAnswers: string[],
): boolean {
  const normalizedGuess = normalizeAnswer(guess);
  const compactGuess = compactNormalizeAnswer(guess);

  if (!normalizedGuess) {
    return false;
  }

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer);

    if (!normalizedAnswer) {
      return false;
    }

    return (
      normalizedAnswer === normalizedGuess ||
      compactNormalizeAnswer(answer) === compactGuess
    );
  });
}
