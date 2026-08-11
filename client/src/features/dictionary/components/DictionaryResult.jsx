import { Brain } from "lucide-react";
import { cn } from "../../../utils/cn.js";
import PronunciationButton from "./PronunciationButton.jsx";

const inputTypeLabels = {
  word: "Từ đơn",
  phrase: "Cụm từ",
  idiom: "Thành ngữ",
  sentence: "Câu",
  paragraph: "Đoạn văn",
};

function ResultList({ compact, items, title }) {
  if (!items?.length) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-ink-muted">{title}</h4>
      <ul className={cn("grid gap-2 text-sm leading-relaxed text-ink-body", !compact && "sm:grid-cols-2")}>
        {items.map((item, index) => (
          <li className="rounded-lg bg-cream-soft px-3 py-2.5" key={`${title}-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TextResultSection({ children, label }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-ink-muted">{label}</h4>
      <p className="rounded-lg bg-cream-soft px-3 py-2.5 text-sm leading-relaxed text-coal">{children}</p>
    </section>
  );
}

export default function DictionaryResult({ className, compact = false, result, showOverview = true, showPrimary = true }) {
  if (!result) return null;

  return (
    <article
      className={cn(
        "space-y-5",
        !compact && "rounded-xl border border-[#e6dfd8] bg-canvas p-5 shadow-[0_18px_50px_rgba(20,20,19,0.06)] sm:p-7",
        className,
      )}
    >
      {showOverview ? <div className={cn("rounded-xl border border-[#e6dfd8] bg-cream-soft", compact ? "p-3" : "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-bold text-white">
            {inputTypeLabels[result.inputType] || result.inputType || "Tra từ"}
          </span>
          {result.sourceLabel ? (
            <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-muted">
              Nguồn: {result.sourceLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className={cn("break-words font-display font-semibold text-coal", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
              {result.query}
            </h2>
            {result.partOfSpeech ? <p className="mt-1 text-sm text-ink-muted">{result.partOfSpeech}</p> : null}
          </div>
          <PronunciationButton audioUrl={result.audioUrl} text={result.query} />
        </div>

        {result.phonetic ? (
          <p className="mt-3 inline-flex rounded-md bg-canvas px-2.5 py-1.5 font-mono text-sm font-semibold text-coal">
            <span className="mr-2 text-xs font-black uppercase text-ink-muted">IPA</span>
            {result.phonetic}
          </p>
        ) : null}
      </div> : null}

      {showPrimary && result.vietnameseMeaning ? <TextResultSection label="Nghĩa tiếng Việt">{result.vietnameseMeaning}</TextResultSection> : null}
      {showPrimary && result.translation ? <TextResultSection label="Bản dịch">{result.translation}</TextResultSection> : null}

      {result.contextualMeaning || result.explanation || result.nuance ? (
        <section className="space-y-2 rounded-xl border border-[#e6dfd8] bg-cream-soft p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-coal">
            <Brain className="h-4 w-4 text-coral" />
            Giải thích
          </h4>
          {[result.contextualMeaning, result.explanation, result.nuance].filter(Boolean).map((item, index) => (
            <p className="text-sm leading-relaxed text-ink-body" key={index}>
              {item}
            </p>
          ))}
        </section>
      ) : null}

      {result.pronunciationHint ? <TextResultSection label="Phát âm">{result.pronunciationHint}</TextResultSection> : null}
      <ResultList compact={compact} items={result.examples} title="Ví dụ" />
      <ResultList compact={compact} items={result.collocations} title="Collocation" />
      <ResultList compact={compact} items={result.relatedTerms} title="Từ liên quan" />
    </article>
  );
}
