import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ChevronRight, Clock3, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { clearDictionaryHistory, getDictionaryHistory, removeDictionaryHistory } from "../services/dictionaryApi.js";
import PronunciationButton from "../components/PronunciationButton.jsx";

const inputTypeLabels = { word: "Từ đơn", phrase: "Cụm từ", idiom: "Thành ngữ", sentence: "Câu", paragraph: "Đoạn văn" };
const pageSize = 9;

function formatDay(value) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getDayKey(item) {
  return new Date(item.updatedAt || item.createdAt).toDateString();
}

function ResultSection({ title, children }) {
  return <section className="mt-4"><h3 className="text-xs font-black uppercase tracking-wide text-ink-muted">{title}</h3><div className="mt-2 text-sm leading-relaxed text-ink-body">{children}</div></section>;
}

function HistoryCard({ item, onRemove }) {
  const result = item.result || {};
  return <Card className="h-full overflow-hidden"><CardContent className="p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
          <span className="rounded-full bg-coral px-2.5 py-1 text-white">{inputTypeLabels[result.inputType] || result.inputType || "Tra từ"}</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {formatTime(item.updatedAt || item.createdAt)}</span>
        </div>
        <h2 className="mt-3 break-words font-display text-2xl font-semibold text-coal">{result.query || item.query}</h2>
        {result.partOfSpeech ? <p className="mt-1 text-sm text-ink-muted">{result.partOfSpeech}</p> : null}
        {result.phonetic ? <p className="mt-2 inline-flex rounded-md bg-cream-soft px-2.5 py-1.5 font-mono text-sm font-semibold text-coal"><span className="mr-2 text-xs font-black uppercase text-ink-muted">IPA</span>{result.phonetic}</p> : null}
      </div>
      <div className="flex shrink-0 items-center"><PronunciationButton audioUrl={result.audioUrl} text={result.query || item.query} /><Button aria-label={`Xoá ${item.query} khỏi lịch sử`} onClick={() => onRemove(item)} size="icon" type="button" variant="ghost"><Trash2 size={16} /></Button></div>
    </div>

    {result.vietnameseMeaning ? <ResultSection title="Nghĩa tiếng Việt"><p className="rounded-lg bg-cream-soft p-3 text-coal">{result.vietnameseMeaning}</p></ResultSection> : null}
    {result.translation ? <ResultSection title="Bản dịch"><p className="rounded-lg bg-cream-soft p-3 text-coal">{result.translation}</p></ResultSection> : null}
    {(result.contextualMeaning || result.explanation || result.nuance) ? <ResultSection title="Giải thích"><div className="space-y-2">{[result.contextualMeaning, result.explanation, result.nuance].filter(Boolean).map((text, index) => <p key={`${item._id}-explanation-${index}`}>{text}</p>)}</div></ResultSection> : null}
    {result.pronunciationHint ? <ResultSection title="Phát âm"><p>{result.pronunciationHint}</p></ResultSection> : null}
    {result.examples?.length ? <ResultSection title="Ví dụ"><ul className="list-disc space-y-2 pl-5">{result.examples.map((example, index) => <li key={`${item._id}-example-${index}`}>{example}</li>)}</ul></ResultSection> : null}
    {result.collocations?.length ? <ResultSection title="Collocation"><ul className="list-disc space-y-1.5 pl-5">{result.collocations.map((itemText, index) => <li key={`${item._id}-collocation-${index}`}>{itemText}</li>)}</ul></ResultSection> : null}
    {result.relatedTerms?.length ? <ResultSection title="Từ liên quan"><ul className="list-disc space-y-1.5 pl-5">{result.relatedTerms.map((itemText, index) => <li key={`${item._id}-related-${index}`}>{itemText}</li>)}</ul></ResultSection> : null}
  </CardContent></Card>;
}

export default function DictionaryHistoryPage() {
  const listTopRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    getDictionaryHistory({ limit: 50 })
      .then((response) => { if (active) setHistory(response.data.data.history || []); })
      .catch(() => { if (active) setError("Không tải được lịch sử tra từ."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const groupedHistory = useMemo(() => history.reduce((groups, item) => {
    const key = getDayKey(item);
    if (!groups[key]) groups[key] = { label: formatDay(item.updatedAt || item.createdAt), items: [] };
    groups[key].items.push(item);
    return groups;
  }, {}), [history]);
  const selectedGroup = selectedDay ? groupedHistory[selectedDay] : null;
  const totalPages = Math.max(1, Math.ceil((selectedGroup?.items.length || 0) / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleWords = selectedGroup?.items.slice(pageStart, pageStart + pageSize) || [];

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function selectDay(dayKey) {
    setSelectedDay(dayKey);
    setCurrentPage(1);
  }

  function closeDay() {
    setSelectedDay(null);
    setCurrentPage(1);
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function handleRemove(item) {
    await removeDictionaryHistory(item._id);
    const nextHistory = history.filter((historyItem) => historyItem._id !== item._id);
    setHistory(nextHistory);
    if (selectedDay && !nextHistory.some((historyItem) => getDayKey(historyItem) === selectedDay)) closeDay();
  }

  async function handleClear() {
    await clearDictionaryHistory();
    setHistory([]);
    closeDay();
  }

  return <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl">
    <div className="scroll-mt-16 flex flex-wrap items-end justify-between gap-4 border-b pb-6 md:scroll-mt-20" ref={listTopRef}><div>{selectedGroup ? <Button className="mb-3" onClick={closeDay} size="sm" type="button" variant="ghost"><ArrowLeft size={16} /> Danh sách ngày</Button> : <p className="eyebrow">Từ điển</p>}<h1 className="mt-2 font-display text-3xl font-normal capitalize sm:text-4xl">{selectedGroup ? selectedGroup.label : "Từ đã tra gần đây"}</h1><p className="mt-2 text-sm font-medium text-ink-muted">{selectedGroup ? `${selectedGroup.items.length} từ đã tra trong ngày này.` : "Chọn một ngày để ôn lại nghĩa và ví dụ."}</p></div>{history.length && !selectedGroup ? <Button onClick={handleClear} type="button" variant="outline"><Trash2 size={16} /> Xoá lịch sử</Button> : null}</div>
    {loading ? <LoadingState className="mt-8" label="Đang tải lịch sử..." /> : null}
    {error ? <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
    {!loading && !history.length ? <Card className="mt-8 border-dashed"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><BookOpen className="text-coral" size={32} /><p className="font-semibold text-coal">Chưa có từ nào được tra.</p><p className="text-sm text-ink-muted">Mở từ điển ở thanh trên cùng để bắt đầu lưu từ mới.</p></CardContent></Card> : null}
    {!loading && !selectedGroup && history.length ? <div className="mt-8 grid max-w-4xl gap-3">{Object.entries(groupedHistory).map(([key, group]) => <button className="flex w-full items-center gap-4 rounded-lg border border-[#e6dfd8] bg-canvas p-4 text-left transition hover:border-coral/40 hover:bg-cream-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:p-5" key={key} onClick={() => selectDay(key)} type="button"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-coral"><CalendarDays size={21} /></span><span className="min-w-0 flex-1"><span className="block font-display text-lg font-semibold capitalize text-coal">{group.label}</span><span className="mt-1 block text-sm text-ink-muted">{group.items.length} từ đã tra</span></span><ChevronRight className="shrink-0 text-ink-muted" size={20} /></button>)}</div> : null}
    {selectedGroup ? <><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visibleWords.map((item) => <HistoryCard item={item} key={item._id} onRemove={handleRemove} />)}</div>{selectedGroup.items.length > pageSize ? <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-[#e6dfd8] pt-5"><Button className="justify-self-start" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} size="sm" type="button" variant="outline"><ArrowLeft size={15} /><span><span className="hidden sm:inline">Trang </span>trước</span></Button><p className="text-center text-xs font-semibold text-ink-muted">Trang {currentPage} / {totalPages}</p><Button className="justify-self-end" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} size="sm" type="button" variant="outline"><span><span className="hidden sm:inline">Trang </span>sau</span><ArrowRight size={15} /></Button></div> : null}</> : null}
  </div></section>;
}
