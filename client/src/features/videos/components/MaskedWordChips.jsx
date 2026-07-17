import { Eye } from "lucide-react";
import { getMaskedWords } from "../utils/dictationText.js";

export default function MaskedWordChips({ difficulty, onRevealWord, revealedWordIndexes, text }) {
  const maskedWords = getMaskedWords(difficulty, text);

  return (
    <div className="flex flex-wrap gap-2">
      {maskedWords.map((word, index) => (
        <span className="inline-flex flex-col items-center gap-1" key={`${word.original}-${index}`}>
          <button
            aria-label={`Hiện từ ${index + 1}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream-soft hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/25"
            onClick={() => onRevealWord(index)}
            type="button"
          >
            <Eye size={14} />
          </button>
          <span
            className={[
              "inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-semibold",
              word.revealed || revealedWordIndexes.includes(index)
                ? "border-[#bfe9c9] bg-[#dff4e4] text-[#276237]"
                : "border-[#e6dfd8] bg-cream-soft text-coal",
            ].join(" ")}
          >
            {word.revealed || revealedWordIndexes.includes(index) ? word.original : word.value}
          </span>
        </span>
      ))}
    </div>
  );
}
