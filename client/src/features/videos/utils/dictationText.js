export function getMaskedWords(difficulty, text) {
  const words = text.split(/\s+/).filter(Boolean);

  return words.map((word, index) => {
    if (difficulty === "easy") {
      return index % 4 === 1
        ? { original: word, value: maskWordKeepPunctuation(word), revealed: false }
        : { original: word, value: word, revealed: true };
    }

    return { original: word, value: maskWordKeepPunctuation(word), revealed: false };
  });
}

export function maskWordKeepPunctuation(word) {
  return String(word || "").replace(/[\p{L}\p{N}]/gu, "*");
}

export function normalizeDictationAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B\u02BC\uFF07`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildInlineAnswer(text, difficulty, inlineWordAnswers, revealedWordIndexes) {
  return getMaskedWords(difficulty, text)
    .map((word, index) => {
      const shouldUseOriginal = word.revealed || revealedWordIndexes.includes(index);
      if (shouldUseOriginal) return word.original;

      const { leading, trailing } = splitWordPunctuation(word.original);
      const answerPart = String(inlineWordAnswers[index] || "").trim();

      return answerPart ? `${leading}${answerPart}${trailing}` : "";
    })
    .filter(Boolean)
    .join(" ");
}

export function splitWordPunctuation(word) {
  const chars = Array.from(String(word || ""));
  const isWordChar = (char) => /[\p{L}\p{N}']/u.test(char);
  const firstWordIndex = chars.findIndex(isWordChar);

  if (firstWordIndex === -1) {
    return { core: word, leading: "", trailing: "" };
  }

  let lastWordIndex = chars.length - 1;
  while (lastWordIndex >= firstWordIndex && !isWordChar(chars[lastWordIndex])) {
    lastWordIndex -= 1;
  }

  return {
    leading: chars.slice(0, firstWordIndex).join(""),
    core: chars.slice(firstWordIndex, lastWordIndex + 1).join(""),
    trailing: chars.slice(lastWordIndex + 1).join(""),
  };
}

export function formatDuration(seconds) {
  const totalSeconds = Math.max(Number(seconds || 0), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
