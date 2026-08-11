import { ArrowLeftRight, ArrowRight, BookOpen, Clock3, Languages, Search, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import DictionaryResult from "../components/DictionaryResult.jsx";
import PronunciationButton from "../components/PronunciationButton.jsx";
import {
  DICTIONARY_MODELS,
  DICTIONARY_MODEL_STORAGE_KEY,
  getStoredDictionaryModel,
} from "../constants/dictionaryModels.js";
import { getDictionaryHistory, lookupDictionary } from "../services/dictionaryApi.js";

const RECENT_HISTORY_LIMIT = 6;
const suggestionQueries = ["break the ice", "thoughtful", "get used to"];

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(getStoredDictionaryModel);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDictionaryHistory({ limit: RECENT_HISTORY_LIMIT })
      .then((response) => {
        if (active) setHistory(response.data.data.history || []);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function performLookup(rawQuery) {
    const value = rawQuery.trim();
    if (!value || loading) return;

    setQuery(value);
    setLoading(true);
    setError("");

    try {
      const response = await lookupDictionary({ model, query: value });
      const nextResult = response.data.data.result;
      const savedHistoryItem = response.data.data.historyItem;
      const nextHistoryItem = savedHistoryItem || {
        _id: `local-${Date.now()}`,
        query: value,
        result: nextResult,
        updatedAt: new Date().toISOString(),
      };

      setResult(nextResult);
      setHistory((current) => [
        nextHistoryItem,
        ...current.filter((item) => item.query.trim().toLowerCase() !== value.toLowerCase()),
      ].slice(0, RECENT_HISTORY_LIMIT));
    } catch (lookupError) {
      setError(lookupError?.response?.data?.message || "Không tra được từ điển lúc này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    performLookup(query);
  }

  function selectHistoryItem(item) {
    setQuery(item.query);
    setResult(item.result);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearLookup() {
    setQuery("");
    setResult(null);
    setError("");
  }

  const primaryTranslation = result?.translation || result?.vietnameseMeaning;

  return (
    <section className="px-4 py-7 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow flex items-center gap-2"><Languages size={14} /> Từ điển Anh–Việt</p>
            <h1 className="mt-2 font-display text-3xl font-normal tracking-[-0.035em] text-coal sm:text-4xl">Tra từ theo ngữ cảnh</h1>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-ink-muted sm:text-right">
            Nghĩa tiếng Việt, IPA, cách dùng và ví dụ tự nhiên trong một lần tra.
          </p>
        </header>

        <div className="mt-7 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-coal">
            <Languages size={16} className="text-coral" /> Văn bản
          </span>
          <span className="hidden text-xs text-ink-muted sm:inline">Hỗ trợ từ đơn, cụm từ, câu và đoạn văn</span>
        </div>

        <form className="relative mt-3 overflow-hidden rounded-2xl border border-[#d8d0c6] bg-canvas shadow-[0_18px_48px_rgba(20,20,19,0.08)]" onSubmit={handleSubmit}>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-2.5 z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-[#d8d0c6] bg-canvas text-coal shadow-sm md:flex"
            title="Anh sang Việt"
          >
            <ArrowLeftRight size={16} />
          </span>

          <div className="grid md:grid-cols-2">
            <div className="min-w-0">
              <div className="flex h-14 items-center gap-1 border-b px-3 sm:px-4">
                <span className="flex h-full items-center border-b-2 border-coral px-2 text-sm font-semibold text-coral">Phát hiện ngôn ngữ</span>
                <span className="px-3 text-sm font-semibold text-ink-muted">Anh</span>
              </div>

              <div className="relative flex min-h-[250px] flex-col sm:min-h-[285px]">
                <Textarea
                  aria-label="Văn bản tiếng Anh cần tra"
                  autoFocus
                  className="min-h-[195px] flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-5 pr-12 text-xl leading-relaxed shadow-none placeholder:text-ink-muted/60 focus:border-transparent focus:ring-0 sm:min-h-[225px] sm:px-6 sm:text-2xl"
                  maxLength={1200}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      performLookup(query);
                    }
                  }}
                  placeholder="Nhập từ, cụm từ hoặc câu..."
                  value={query}
                />
                {query ? (
                  <Button aria-label="Xoá nội dung" className="absolute right-3 top-3" onClick={clearLookup} size="icon" type="button" variant="ghost">
                    <X size={19} />
                  </Button>
                ) : null}
                <div className="flex items-center justify-between gap-3 px-4 pb-4 sm:px-5">
                  <span className="text-xs text-ink-muted">{query.length} / 1200</span>
                  <Button disabled={loading || !query.trim()} type="submit">
                    {loading ? <Spinner size="sm" /> : <Search size={17} />}
                    {loading ? "Đang tra..." : "Tra từ"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-w-0 border-t bg-cream-soft md:border-l md:border-t-0">
              <div className="flex h-14 items-center justify-between gap-3 border-b px-4 sm:px-5">
                <span className="flex h-full items-center border-b-2 border-coral px-2 text-sm font-semibold text-coral">Việt</span>
                <Select
                  disabled={loading}
                  onValueChange={(value) => {
                    setModel(value);
                    window.localStorage.setItem(DICTIONARY_MODEL_STORAGE_KEY, value);
                  }}
                  value={model}
                >
                  <SelectTrigger aria-label="Chọn model dịch" className="h-8 w-[210px] border-0 bg-canvas px-2.5 font-mono text-[10px] shadow-sm">
                    <SelectValue className="block max-w-[165px] truncate whitespace-nowrap" />
                  </SelectTrigger>
                  <SelectContent>
                    {DICTIONARY_MODELS.map((item) => (
                      <SelectItem className="font-mono text-xs" key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div aria-busy={loading} aria-live="polite" className="min-h-[250px] p-5 sm:min-h-[285px] sm:p-6">
                {loading ? (
                  <div className="flex h-full min-h-[205px] flex-col items-center justify-center gap-3 text-sm text-ink-muted">
                    <Spinner /> Đang phân tích nghĩa theo ngữ cảnh...
                  </div>
                ) : null}

                {!loading && error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
                ) : null}

                {!loading && !error && !result ? (
                  <div className="flex min-h-[205px] flex-col justify-between">
                    <p className="text-2xl text-ink-muted/65">Bản dịch</p>
                    <p className="text-xs leading-relaxed text-ink-muted">Nhấn Enter để tra · Shift + Enter để xuống dòng</p>
                  </div>
                ) : null}

                {!loading && !error && result ? (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="break-words text-2xl font-medium leading-relaxed text-coal sm:text-3xl">{primaryTranslation}</p>
                        {result.partOfSpeech ? <p className="mt-3 text-sm italic text-ink-muted">{result.partOfSpeech}</p> : null}
                      </div>
                      <PronunciationButton audioUrl={result.audioUrl} text={result.query} />
                    </div>
                    {result.phonetic ? <p className="mt-4 font-mono text-sm font-semibold text-ink-body">{result.phonetic}</p> : null}
                    {result.sourceLabel ? <p className="mt-5 text-xs text-ink-muted">Nguồn: {result.sourceLabel}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-start justify-center gap-8">
          <Link className="group flex flex-col items-center gap-2 text-sm font-semibold text-ink-muted" to="/dictionary/history">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d8d0c6] bg-canvas transition group-hover:border-coral/50 group-hover:bg-cream-soft group-hover:text-coral">
              <Clock3 size={23} />
            </span>
            Nhật ký
          </Link>
        </div>

        {!historyLoading && history.length ? (
          <section className="mt-9 border-t border-[#e6dfd8] pt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-coal">Tra gần đây</h2>
              <Button asChild size="sm" variant="ghost"><Link to="/dictionary/history">Xem tất cả <ArrowRight size={14} /></Link></Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  className="rounded-full border border-[#d8d0c6] bg-canvas px-4 py-2 text-sm font-semibold text-ink-body transition hover:border-coral/50 hover:bg-cream-soft hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
                  key={item._id}
                  onClick={() => selectHistoryItem(item)}
                  type="button"
                >
                  {item.query}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {!result && !error ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {suggestionQueries.map((suggestion, index) => (
              <button
                className="flex items-center gap-3 rounded-xl border border-[#e6dfd8] bg-canvas p-4 text-left transition hover:-translate-y-0.5 hover:border-coral/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35"
                key={suggestion}
                onClick={() => performLookup(suggestion)}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-coral">
                  {index === 0 ? <BookOpen size={17} /> : <Sparkles size={17} />}
                </span>
                <span><span className="block text-xs text-ink-muted">Thử tra</span><span className="mt-0.5 block font-semibold text-coal">{suggestion}</span></span>
              </button>
            ))}
          </div>
        ) : null}

        {result ? (
          <section className="mt-10">
            <div className="mb-4">
              <p className="eyebrow">Chi tiết từ điển</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-coal">Cách dùng và ví dụ</h2>
            </div>
            <DictionaryResult result={result} showOverview={false} showPrimary={false} />
          </section>
        ) : null}
      </div>
    </section>
  );
}
