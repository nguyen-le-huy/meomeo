import { ArrowLeft, Bookmark, CheckCircle2, Share2, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { readingLessons } from "../constants/readingLessons.js";
import { useReading } from "../hooks/useReadings.js";
import { useMyAttempt, useSubmitAttempt, useAttempts, useDeleteAttempt } from "../hooks/useAttempts.js";
import { normalizeReading } from "../utils/readingFormat.js";
import { useAuthStore } from "../../auth/stores/authStore.js";

const highlightColors = [
  { className: "border-yellow-500 bg-yellow-300", label: "Vàng", value: "yellow" },
  { className: "border-emerald-500 bg-emerald-300", label: "Xanh", value: "green" },
  { className: "border-violet-500 bg-violet-300", label: "Tím", value: "purple" },
];

const SAFE_TAGS = ["p", "div", "br", "img", "a", "strong", "em", "b", "i", "u", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "blockquote", "ul", "ol", "li", "span", "hr", "pre", "code", "sub", "sup"];

function sanitizeHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<(\w+)(\s[^>]*)?(\s)on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "<$1$2$3")
    .replace(/<(\w+)(\s[^>]*)?(\s)on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)(\s[^>]*)?>/gi, "<$1$2$3$5>")
    .replace(/(<a\s[^>]*href\s*=\s*["'])javascript:/gi, "$1")
    .replace(/<(!\[CDATA\[|![\-]{2})/gi, "<!--")
    .replace(/<!\[CDATA\[.*?\]\]>/gi, "");
}

const markClassByColor = {
  draft: "reading-mark reading-mark-draft",
  green: "reading-mark reading-mark-green",
  purple: "reading-mark reading-mark-purple",
  yellow: "reading-mark reading-mark-yellow",
};

function splitTextWithHighlights(text, highlights = []) {
  const value = String(text || "");
  const matches = [];

  for (const highlight of highlights) {
    const needle = String(highlight.text || "").trim();
    if (needle.length < 2) continue;

    let start = value.indexOf(needle);
    while (start !== -1) {
      matches.push({
        color: highlight.color || "yellow",
        end: start + needle.length,
        id: highlight.id,
        start,
      });
      start = value.indexOf(needle, start + needle.length);
    }
  }

  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const accepted = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    accepted.push(match);
    cursor = match.end;
  }

  const parts = [];
  cursor = 0;
  for (const match of accepted) {
    if (match.start > cursor) {
      parts.push({ text: value.slice(cursor, match.start), type: "text" });
    }
    parts.push({ color: match.color, id: match.id, text: value.slice(match.start, match.end), type: "mark" });
    cursor = match.end;
  }
  if (cursor < value.length) parts.push({ text: value.slice(cursor), type: "text" });

  return parts.length ? parts : [{ text: value, type: "text" }];
}

function HighlightedText({ highlights = [], value }) {
  return splitTextWithHighlights(value, highlights).map((part, index) => {
    if (part.type !== "mark") return <React.Fragment key={index}>{part.text}</React.Fragment>;
    return (
      <mark className={markClassByColor[part.color] || markClassByColor.yellow} data-highlight-id={part.id} key={index}>
        {part.text}
      </mark>
    );
  });
}

function buildHighlightedHtml(html, highlights = []) {
  const safeHtml = sanitizeHtml(html);
  if (!safeHtml || !highlights.length || typeof window === "undefined") return safeHtml;

  const template = document.createElement("template");
  template.innerHTML = safeHtml;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node = walker.nextNode();

  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }

  for (const textNode of nodes) {
    const parts = splitTextWithHighlights(textNode.textContent, highlights);
    if (!parts.some((part) => part.type === "mark")) continue;

    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (part.type === "mark") {
        const mark = document.createElement("mark");
        mark.className = markClassByColor[part.color] || markClassByColor.yellow;
        mark.dataset.highlightId = part.id || "";
        mark.textContent = part.text;
        fragment.appendChild(mark);
      } else {
        fragment.appendChild(document.createTextNode(part.text));
      }
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return template.innerHTML;
}

function BodyHtmlRenderer({ highlights = [], html }) {
  if (!html) return null;
  const safeHtml = buildHighlightedHtml(html, highlights);
  return (
    <div
      className="bbc-article-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

function parseBodyImageBlock(value) {
  const markdownImage = String(value || "").trim().match(/^!\[(?<caption>[^\]]*)\]\((?<url>https?:\/\/[^)]+)\)(?:\s*\{credit=(?<credit>[^}]+)\})?$/i);
  if (markdownImage?.groups?.url) {
    return {
      caption: markdownImage.groups.caption || "",
      credit: markdownImage.groups.credit || "Meomeo Library",
      url: markdownImage.groups.url,
    };
  }

  const imageBlock = String(value || "").trim().match(/^\[image:\s*(?<url>https?:\/\/[^|\]]+)(?:\s*\|\s*(?<caption>[^|\]]+))?(?:\s*\|\s*(?<credit>[^\]]+))?\]$/i);
  if (imageBlock?.groups?.url) {
    return {
      caption: imageBlock.groups.caption || "",
      credit: imageBlock.groups.credit || "Meomeo Library",
      url: imageBlock.groups.url.trim(),
    };
  }

  return null;
}

function isQuoteBlock(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("> ")) return trimmed.slice(2);
  if (trimmed.startsWith("“") && trimmed.endsWith("”")) return trimmed.slice(1, -1);
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  return null;
}

function isSubheading(value) {
  const trimmed = value.trim();
  if (/^#{1,3}\s/.test(trimmed)) return trimmed.replace(/^#{1,3}\s+/, "");
  if (trimmed.length <= 90 && !trimmed.includes(".") && !trimmed.includes("?") && !trimmed.includes("!") && trimmed === trimmed.toUpperCase()) {
    return trimmed;
  }
  return null;
}

const INLINE_PATTERN = /(\[(.+?)\]\((.+?)\))|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|((?:https?:\/\/)[^\s<>"')\]]+)/g;

function parseInlineSegments(text) {
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      segments.push({ type: "link", content: match[2], url: match[3] });
    } else if (match[4]) {
      segments.push({ type: "bold", content: match[5] });
    } else if (match[6]) {
      segments.push({ type: "italic", content: match[7] });
    } else if (match[8]) {
      segments.push({ type: "code", content: match[9] });
    } else if (match[10]) {
      segments.push({ type: "link", content: match[10], url: match[10] });
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", content: text }];
}

function InlineContent({ highlights = [], value }) {
  const segments = parseInlineSegments(value);

  return segments.map((seg, i) => {
    switch (seg.type) {
      case "link":
        return (
          <a className="bbc-link" href={seg.url} key={i} rel="noopener noreferrer" target="_blank">
            {seg.content}
          </a>
        );
      case "bold":
        return <strong key={i}>{seg.content}</strong>;
      case "italic":
        return <em key={i}>{seg.content}</em>;
      case "code":
        return <code className="bbc-code" key={i}>{seg.content}</code>;
      default:
        return <HighlightedText highlights={highlights} key={i} value={seg.content} />;
    }
  });
}

function RichParagraph({ highlights = [], value }) {
  const image = parseBodyImageBlock(value);
  if (image) {
    return (
      <figure className="!my-6">
        <div className="relative">
          <img alt={image.caption} className="w-full object-cover" src={image.url} />
          {image.credit ? (
            <figcaption className="absolute bottom-0 right-0 bg-coal px-2 py-1 text-xs font-semibold text-white">
              {image.credit}
            </figcaption>
          ) : null}
        </div>
        {image.caption ? <p className="bbc-article-caption mt-2"><InlineContent highlights={highlights} value={image.caption} /></p> : null}
      </figure>
    );
  }

  const quoteText = isQuoteBlock(value);
  if (quoteText) {
    return (
      <blockquote className="bbc-blockquote">
        <InlineContent highlights={highlights} value={quoteText} />
      </blockquote>
    );
  }

  const headingText = isSubheading(value);
  if (headingText) {
    return <h3 className="bbc-subheading"><InlineContent highlights={highlights} value={headingText} /></h3>;
  }

  return (
    <p>
      <InlineContent highlights={highlights} value={value} />
    </p>
  );
}

function AdminAttemptsPanel({ attempts, deleteMutation, isAdmin, isLoading, readingId }) {
  if (!isAdmin) return null;
  if (isLoading) {
    return (
      <div className="border-t border-[#d8d0c6] pt-6">
        <p className="text-sm font-semibold text-ink-muted">Đang tải danh sách bài nộp...</p>
      </div>
    );
  }
  if (!attempts?.length) {
    return (
      <div className="border-t border-[#d8d0c6] pt-6">
        <p className="text-sm font-semibold text-ink-muted">Chưa có ai nộp bài đọc này.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[#d8d0c6] pt-6">
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-ink-muted">
        Admin — Lịch sử nộp bài ({attempts.length})
      </h3>
      <div className="mt-4 space-y-3">
        {attempts.map((attempt) => (
          <div className="rounded-lg border border-[#e6dfd8] bg-canvas p-4" key={attempt._id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-coal">
                  Session: <span className="font-mono text-xs text-ink-muted">{attempt.sessionId}</span>
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Đúng {attempt.correctCount}/{attempt.totalQuestions} câu
                  {" · "}
                  {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (!window.confirm("Xoá bài nộp này?")) return;
                  deleteMutation.mutateAsync({ readingId, attemptId: attempt._id });
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <Trash2 size={14} /> Xoá
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              {attempt.answers.map((a) => (
                <p className="text-xs" key={a.questionIndex}>
                  <span className={a.isCorrect ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    Q{a.questionIndex + 1}: {a.selectedChoice}
                  </span>
                  {!a.isCorrect ? (
                    <span className="ml-1 text-ink-muted">(đúng: {a.correctAnswer})</span>
                  ) : null}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReadingPracticePage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const fallbackLesson = useMemo(() => readingLessons.find((item) => item.slug === slug), [slug]);
  const { data: reading, isLoading } = useReading(slug);
  const lesson = normalizeReading(reading) || fallbackLesson;

  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("meomeo-session-id");
    if (stored) return stored;
    const newId = `meo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("meomeo-session-id", newId);
    return newId;
  });

  const { data: existingAttempt, isLoading: attemptLoading } = useMyAttempt(
    lesson?._id,
    sessionId,
    { enabled: Boolean(lesson?._id) },
  );

  const submitMutation = useSubmitAttempt();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const { data: attemptsData, isLoading: attemptsLoading } = useAttempts(
    isAdmin ? lesson?._id : null,
  );

  const deleteAttemptMutation = useDeleteAttempt();

  const [localAnswers, setLocalAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const articleTextRef = useRef(null);
  const highlightStorageKey = `reading-highlights-${lesson?._id || slug}`;
  const [selectionDraft, setSelectionDraft] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const skipNextHighlightSaveRef = useRef(false);
  const toolbarState = activeHighlight || selectionDraft;
  const visibleHighlights = selectionDraft?.text
    ? [...highlights, { color: "draft", id: "__draft__", text: selectionDraft.text }]
    : highlights;

  const submittedAttempt = existingAttempt || (submitMutation.data?.data?.data?.attempt);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.querySelector("main")?.scrollTo?.({ top: 0, left: 0, behavior: "instant" });
    setLocalAnswers({});
    setShowResult(false);
    setActiveHighlight(null);
    setSelectionDraft(null);
    submitMutation.reset();
  }, [slug]);

  useEffect(() => {
    skipNextHighlightSaveRef.current = true;
    try {
      const stored = localStorage.getItem(highlightStorageKey);
      setHighlights(stored ? JSON.parse(stored) : []);
    } catch {
      setHighlights([]);
    }
  }, [highlightStorageKey]);

  useEffect(() => {
    if (skipNextHighlightSaveRef.current) {
      skipNextHighlightSaveRef.current = false;
      return;
    }

    try {
      localStorage.setItem(highlightStorageKey, JSON.stringify(highlights));
    } catch {
      // ignore unavailable storage
    }
  }, [highlightStorageKey, highlights]);

  if (isLoading && !fallbackLesson) {
    return (
      <section className="min-h-full bg-canvas px-4 py-10 text-coal sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-3xl">Đang tải bài đọc...</p>
        </div>
      </section>
    );
  }

  if (!lesson) {
    return (
      <section className="min-h-full bg-canvas px-4 py-10 text-coal sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-3xl">Không tìm thấy bài đọc.</p>
          <Button className="mt-5" onClick={() => navigate("/")} type="button" variant="outline">
            <ArrowLeft size={16} />
            Về trang chủ
          </Button>
        </div>
      </section>
    );
  }

  const paragraphs = lesson.paragraphs || [lesson.passage].filter(Boolean);

  const answers = submittedAttempt
    ? Object.fromEntries(submittedAttempt.answers.map((a) => [a.questionIndex, a.selectedChoice]))
    : localAnswers;

  const isLocked = Boolean(submittedAttempt);

  const correctCount = submittedAttempt
    ? submittedAttempt.correctCount
    : lesson.questions.reduce((total, question, index) => {
        return localAnswers[index] === question.answer ? total + 1 : total;
      }, 0);

  const showAnswers = isLocked || showResult;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!lesson._id) return;
    try {
      await submitMutation.mutateAsync({
        readingId: lesson._id,
        sessionId,
        answers: lesson.questions.map((q, i) => ({
          questionIndex: i,
          selectedChoice: localAnswers[i] || "",
          correctAnswer: q.answer,
        })),
      });
    } catch {
      // error handled by mutation state
    }
  };

  function captureSelection() {
    window.setTimeout(() => {
      const selection = window.getSelection();
      const root = articleTextRef.current;
      if (!selection || selection.isCollapsed || !root || !selection.rangeCount) {
        if (!activeHighlight) setSelectionDraft(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().replace(/\s+/g, " ").trim();
      const anchorInside = root.contains(selection.anchorNode);
      const focusInside = root.contains(selection.focusNode);
      if (!anchorInside || !focusInside || selectedText.length < 2) {
        setSelectionDraft(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setActiveHighlight(null);
      setSelectionDraft({
        left: Math.min(Math.max(rect.left, 12), window.innerWidth - 190),
        text: selectedText,
        top: Math.max(rect.top - 42, 12),
      });
    }, 0);
  }

  function openHighlightToolbar(event) {
    const mark = event.target.closest?.("mark[data-highlight-id]");
    if (!mark || !articleTextRef.current?.contains(mark)) return;

    const id = mark.dataset.highlightId;
    const highlight = highlights.find((item) => item.id === id);
    if (!highlight) return;

    event.preventDefault();
    event.stopPropagation();
    window.getSelection()?.removeAllRanges();

    const rect = mark.getBoundingClientRect();
    setSelectionDraft(null);
    setActiveHighlight({
      id,
      left: Math.min(Math.max(rect.left, 12), window.innerWidth - 230),
      text: highlight.text,
      top: Math.max(rect.top - 42, 12),
    });
  }

  function addHighlight(color = "yellow") {
    if (!selectionDraft?.text) return;

    setHighlights((current) => {
      if (current.some((item) => item.text === selectionDraft.text && (item.color || "yellow") === color)) return current;
      return [
        ...current,
        {
          color,
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
          questionIndex: null,
          text: selectionDraft.text,
        },
      ];
    });
    setSelectionDraft(null);
    window.getSelection()?.removeAllRanges();
  }

  function updateHighlightColor(color) {
    if (!activeHighlight?.id) return;
    setHighlights((current) =>
      current.map((item) =>
        item.id === activeHighlight.id ? { ...item, color } : item,
      ),
    );
    setActiveHighlight(null);
  }

  function deleteActiveHighlight() {
    if (!activeHighlight?.id) return;
    setHighlights((current) => current.filter((item) => item.id !== activeHighlight.id));
    setActiveHighlight(null);
  }

  return (
    <section className="h-[calc(100dvh-3rem)] overflow-hidden bg-cream-soft text-coal md:h-[calc(100dvh-4rem)]">
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2 p-2 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] md:grid-rows-1 md:gap-3 md:p-4">
        <article className="bbc-article min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-xl border border-[#d8d0c6] bg-canvas shadow-sm">
          <div
            className="mx-auto min-w-0 max-w-[700px] overflow-x-hidden px-3 py-4 sm:px-6 lg:py-8"
            onClick={openHighlightToolbar}
            onMouseUp={captureSelection}
            onTouchEnd={captureSelection}
            ref={articleTextRef}
          >
          <header>
            <h1 className="bbc-article-title">
              {lesson.title}
            </h1>
            <p className="bbc-article-meta mt-5">{lesson.displayDate}</p>
            <div className="bbc-article-meta mt-4">
              <p className="font-bold text-coal">{lesson.author}</p>
              <p className="text-ink-muted">{lesson.authorRole}</p>
            </div>
          </header>

          <div className="bbc-article-toolbar mt-4 flex items-center gap-5 border-y border-[#d8d0c6] py-3">
            <button className="inline-flex items-center gap-2" type="button">
              Share <Share2 size={16} />
            </button>
            <button className="inline-flex items-center gap-2" type="button">
              Save <Bookmark size={16} />
            </button>
          </div>

          <figure className="mt-4">
            <div className="relative">
              <img alt={lesson.title} className="w-full object-cover" src={lesson.imageUrl} />
              <figcaption className="absolute bottom-0 right-0 bg-coal px-2 py-1 text-xs font-semibold text-white">
                {lesson.imageCredit}
              </figcaption>
            </div>
            <p className="bbc-article-caption mt-2">{lesson.imageCaption}</p>
          </figure>

          {lesson.bodyHtml ? (
            <div className="mt-6">
              <BodyHtmlRenderer highlights={visibleHighlights} html={lesson.bodyHtml} />
            </div>
          ) : (
            <>
              <div className="bbc-article-body mt-6 space-y-5">
                {paragraphs.slice(0, 2).map((paragraph) => (
                  <RichParagraph highlights={visibleHighlights} key={paragraph} value={paragraph} />
                ))}
              </div>

              {lesson.secondaryImageUrl ? (
                <figure className="mt-6">
                  <div className="relative">
                    <img alt="" className="w-full object-cover" src={lesson.secondaryImageUrl} />
                    <figcaption className="absolute bottom-0 right-0 bg-coal px-2 py-1 text-xs font-semibold text-white">
                      {lesson.secondaryImageCredit}
                    </figcaption>
                  </div>
                  <p className="bbc-article-caption mt-2">{lesson.secondaryImageCaption}</p>
                </figure>
              ) : null}

              <div className="bbc-article-body mt-6 space-y-5">
                {paragraphs.slice(2).map((paragraph) => (
                  <RichParagraph highlights={visibleHighlights} key={paragraph} value={paragraph} />
                ))}
              </div>
            </>
          )}
          </div>
        </article>

        <section className="min-h-0 overflow-y-auto rounded-xl border border-[#d8d0c6] bg-canvas shadow-sm">
          <div className="mx-auto max-w-[760px] px-3 py-4 sm:px-6 lg:py-8">
        {lesson.questions.length ? (
          <form
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <h2 className="bbc-article-title text-[28px] sm:text-[32px]">Questions</h2>

            {isLocked ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={17} />
                Đã nộp — Đúng {correctCount}/{lesson.questions.length} câu
              </div>
            ) : null}

            <div className="mt-5 space-y-5">
              {lesson.questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = showAnswers && question.answer === userAnswer;
                const isWrong = showAnswers && userAnswer && userAnswer !== question.answer;

                return (
                <fieldset className="rounded-lg border border-[#e6dfd8] bg-canvas p-4" key={question.prompt}>
                  <legend className="px-1 text-sm font-semibold text-coal">
                    {index + 1}. {question.prompt}
                    {showAnswers && isCorrect ? (
                      <span className="ml-2 text-emerald-600">✓</span>
                    ) : showAnswers && isWrong ? (
                      <span className="ml-2 text-red-600">✗</span>
                    ) : null}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {question.choices.map((choice) => {
                      const selected = userAnswer === choice;
                      const isChoiceCorrect = showAnswers && choice === question.answer;

                      return (
                        <label
                          className={[
                            "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition",
                            isLocked ? "cursor-default" : "",
                            isChoiceCorrect
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : selected && showAnswers && !isChoiceCorrect
                                ? "border-red-200 bg-red-50 text-red-700"
                                : selected && !showAnswers
                                  ? "border-coral bg-cream-soft text-coal"
                                  : "border-[#e6dfd8] bg-white hover:bg-cream-soft",
                          ].join(" ")}
                          key={choice}
                        >
                          <input
                            checked={selected}
                            disabled={isLocked}
                            name={`question-${index}`}
                            onChange={() => {
                              setLocalAnswers((current) => ({ ...current, [index]: choice }));
                              setShowResult(false);
                            }}
                            type="radio"
                            value={choice}
                          />
                          <span>{choice}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                );
              })}
            </div>

            {showResult && !isLocked ? (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={17} />
                Đúng {correctCount}/{lesson.questions.length} câu
              </div>
            ) : null}

            {submitMutation.isError ? (
              <div className="mt-3 text-sm font-semibold text-red-600">
                {submitMutation.error?.response?.data?.message || "Không thể nộp bài. Thử lại."}
              </div>
            ) : null}

            {!isLocked && (
              <Button
                className="mt-5 w-full sm:w-auto"
                disabled={submitMutation.isPending || Object.keys(localAnswers).length < lesson.questions.length}
                type="submit"
              >
                {submitMutation.isPending ? "Đang nộp..." : "Nộp bài đọc"}
              </Button>
            )}
          </form>
        ) : null}

        <AdminAttemptsPanel
          attempts={attemptsData}
          deleteMutation={deleteAttemptMutation}
          isAdmin={isAdmin}
          isLoading={attemptsLoading}
          readingId={lesson?._id}
        />
          </div>
        </section>
      </div>
      {toolbarState ? (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-md border border-[#d8d0c6] bg-white px-2 py-1 shadow-xl"
          onMouseDown={(event) => event.preventDefault()}
          style={{ left: toolbarState.left, top: toolbarState.top }}
        >
          {highlightColors.map((color) => (
            <button
              aria-label={`Đánh dấu ${color.label}`}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#d8d0c6] hover:bg-cream-soft"
              key={color.value}
              onClick={() => activeHighlight ? updateHighlightColor(color.value) : addHighlight(color.value)}
              title={`Đánh dấu ${color.label}`}
              type="button"
            >
              <span className={`h-3 w-5 rounded-sm border ${color.className}`} />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-[#e6dfd8]" />
          {activeHighlight ? (
            <button
              aria-label="Xoá bôi đen"
              className="flex h-7 w-7 items-center justify-center rounded text-[#9a3412] hover:bg-red-50 hover:text-red-700"
              onClick={deleteActiveHighlight}
              title="Xoá bôi đen"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          ) : null}
          <button
            aria-label="Bỏ chọn"
            className="flex h-7 w-7 items-center justify-center rounded text-sm font-black text-ink-muted hover:bg-cream-soft"
            onClick={() => {
              setActiveHighlight(null);
              setSelectionDraft(null);
              window.getSelection()?.removeAllRanges();
            }}
            title="Bỏ chọn"
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}
    </section>
  );
}
