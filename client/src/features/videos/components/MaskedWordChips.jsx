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
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-coal hover:bg-cream"
            onClick={() => onRevealWord(index)}
            type="button"
          >
            <Eye size={14} />
          </button>
          <span
            className={[
              "rounded-md border px-3 py-2 text-sm font-black",
              word.revealed || revealedWordIndexes.includes(index)
                ? "border-[#bfe9c9] bg-[#d7f8df] text-[#0e7a3d]"
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
