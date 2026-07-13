import { useState } from "react";
import { BookOpen, Brain, Search, Sparkles, X } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { lookupDictionary } from "../services/dictionaryApi.js";

const inputTypeLabels = {
  word: "Từ đơn",
  phrase: "Cụm từ",
  idiom: "Thành ngữ",
  sentence: "Câu",
  paragraph: "Đoạn văn",
};

function ResultList({ items, title }) {
  if (!items?.length) return null;

  return (
    <section className="space-y-1.5">
      <p className="text-xs font-black uppercase text-ink-muted">{title}</p>
      <ul className="space-y-1.5 text-sm leading-relaxed text-ink-body">
        {items.map((item, index) => (
          <li className="rounded-md bg-canvas px-2.5 py-2" key={`${title}-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DictionaryPopover({ onClose }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLookup(event) {
    event?.preventDefault();
    const value = query.trim();
    if (!value || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await lookupDictionary({ query: value });
      setResult(response.data.data.result);
    } catch (lookupError) {
      setError(lookupError?.response?.data?.message || "Không tra được từ điển lúc này.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-auto absolute right-1/2 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(78vh,720px)] w-[min(92vw,420px)] translate-x-1/2 flex-col overflow-hidden rounded-xl border border-[#d8d0c6] bg-canvas shadow-2xl md:right-auto md:left-1/2 md:-translate-x-1/2">
      <div className="flex items-center justify-between border-b border-[#e6dfd8] bg-cream-soft px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-coal">Từ điển Anh-Việt</p>
          <p className="text-xs text-ink-muted">Phân loại và giải nghĩa bằng AI qua server</p>
        </div>
        <Button aria-label="Đóng từ điển" onClick={onClose} size="icon" type="button" variant="ghost">
          <X size={16} />
        </Button>
      </div>

      <form className="flex gap-2 border-b border-[#e6dfd8] bg-canvas p-3" onSubmit={handleLookup}>
        <Input
          autoFocus
          className="h-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nhập từ, cụm từ hoặc câu..."
          value={query}
        />
        <Button className="h-9 shrink-0" disabled={loading || !query.trim()} size="sm" type="submit">
          {loading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
          Tra
        </Button>
      </form>

      <div className="min-h-[280px] flex-1 overflow-y-auto p-4">
        {!result && !error ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center text-ink-muted">
            <div className="rounded-full bg-cream p-3 text-coral">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Nhập từ đơn, phrasal verb, thành ngữ, câu hoặc đoạn văn để nhận nghĩa tiếng Việt theo ngữ cảnh.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-[#e6dfd8] bg-cream-soft p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-bold text-white">
                  {inputTypeLabels[result.inputType] || result.inputType}
                </span>
                <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-ink-muted">
                  Nguồn: {result.sourceLabel}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-coal">{result.query}</h3>
              {(result.partOfSpeech || result.phonetic) ? (
                <p className="text-sm text-ink-muted">
                  {[result.partOfSpeech, result.phonetic].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>

            {result.vietnameseMeaning ? (
              <section className="space-y-1.5">
                <p className="text-xs font-black uppercase text-ink-muted">Nghĩa tiếng Việt</p>
                <p className="rounded-lg bg-canvas p-3 text-sm leading-relaxed text-coal">{result.vietnameseMeaning}</p>
              </section>
            ) : null}

            {result.translation ? (
              <section className="space-y-1.5">
                <p className="text-xs font-black uppercase text-ink-muted">Bản dịch</p>
                <p className="rounded-lg bg-canvas p-3 text-sm leading-relaxed text-coal">{result.translation}</p>
              </section>
            ) : null}

            {(result.contextualMeaning || result.explanation || result.nuance) ? (
              <section className="space-y-2 rounded-lg border border-[#e6dfd8] bg-cream-soft p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-coal">
                  <Brain className="h-4 w-4 text-coral" />
                  Giải thích
                </div>
                {[result.contextualMeaning, result.explanation, result.nuance].filter(Boolean).map((item, index) => (
                  <p className="text-sm leading-relaxed text-ink-body" key={index}>
                    {item}
                  </p>
                ))}
              </section>
            ) : null}

            {result.pronunciationHint ? (
              <section className="space-y-1.5">
                <p className="text-xs font-black uppercase text-ink-muted">Phát âm</p>
                <p className="rounded-lg bg-canvas p-3 text-sm leading-relaxed text-ink-body">
                  {result.pronunciationHint}
                </p>
              </section>
            ) : null}

            <ResultList items={result.examples} title="Ví dụ" />
            <ResultList items={result.collocations} title="Collocation" />
            <ResultList items={result.relatedTerms} title="Từ liên quan" />
            <ResultList items={result.notes} title="Ghi chú" />

            <div className="flex items-start gap-2 rounded-lg border border-[#e6dfd8] bg-canvas p-3 text-xs leading-relaxed text-ink-muted">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
              Tất cả yêu cầu được xử lý qua server để bảo mật API key. Từ đơn ưu tiên Cambridge, cụm/câu dùng AI.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
