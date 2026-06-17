import { Eye } from "lucide-react";
import {
  getMaskedWords,
  maskWordKeepPunctuation,
  normalizeDictationAnswer,
  splitWordPunctuation,
} from "../utils/dictationText.js";

export default function InlineDictationInputs({ difficulty, inlineWordAnswers, onChangeWord, onRevealWord, revealedWordIndexes, text }) {
  const maskedWords = getMaskedWords(difficulty, text);

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[#dbe4ee] bg-white p-3 shadow-sm">
      {maskedWords.map((word, index) => {
        const isRevealed = word.revealed || revealedWordIndexes.includes(index);
        const { core, leading, trailing } = splitWordPunctuation(word.original);
        const currentAnswer = inlineWordAnswers[index] || "";
        const normalizedCurrentAnswer = normalizeDictationAnswer(currentAnswer);
        const normalizedCore = normalizeDictationAnswer(core);
        const hasAttempt = normalizedCurrentAnswer.length > 0;
        const isCorrectAttempt = hasAttempt && normalizedCurrentAnswer === normalizedCore;
        const isIncorrectAttempt = hasAttempt && normalizedCurrentAnswer !== normalizedCore;
        const inputSize = Math.max(core.length, 2);

        return (
          <span className="inline-flex flex-col items-center gap-1" key={`${word.original}-${index}`}>
            <button
              aria-label={`Hiện từ ${index + 1}`}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-coal hover:bg-[#eef3fb] disabled:opacity-70"
              disabled={isRevealed}
              onClick={() => onRevealWord(index)}
              type="button"
            >
              <Eye size={14} />
            </button>
            {isRevealed ? (
              <span className="rounded-md border border-[#bfe9c9] bg-[#d7f8df] px-3 py-2 text-sm font-black text-[#0e7a3d]">
                {word.original}
              </span>
            ) : (
              <span
                className={[
                  "inline-flex items-center rounded-md border px-2 py-1.5 text-sm font-black transition-colors",
                  isIncorrectAttempt
                    ? "border-red-300 bg-red-50 text-red-700"
                    : isCorrectAttempt
                      ? "border-[#bfe9c9] bg-[#d7f8df] text-[#0e7a3d]"
                      : "border-[#dbe4ee] bg-[#f9fbff] text-coal",
                ].join(" ")}
              >
                {leading ? <span>{leading}</span> : null}
                <input
                  aria-label={`Điền từ ${index + 1}`}
                  aria-invalid={isIncorrectAttempt}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className={[
                    "min-w-8 bg-transparent text-center font-black outline-none",
                    isIncorrectAttempt ? "placeholder:text-red-300" : "placeholder:text-coal/40",
                  ].join(" ")}
                  onChange={(event) => onChangeWord(index, event.target.value)}
                  placeholder={maskWordKeepPunctuation(core)}
                  size={inputSize}
                  spellCheck={false}
                  value={currentAnswer}
                />
                {trailing ? <span>{trailing}</span> : null}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
