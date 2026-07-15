import { Edit3, FilePlus2, Heading2, ImagePlus, ListPlus, Plus, Quote, RemoveFormatting, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "../../../components/ui/alert.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";

const emptyQuestion = {
  prompt: "",
  choicesText: "Option A\nOption B\nOption C\nOption D",
  answerIndex: 0,
  explanation: "",
};

const emptyForm = {
  title: "",
  slug: "",
  summary: "",
  author: "Meo Meo English",
  authorRole: "Biên tập viên",
  level: "TOEIC A2",
  publishedAt: new Date().toISOString().slice(0, 10),
  imageUrl: "",
  imageCredit: "Meomeo Library",
  imageCaption: "",
  secondaryImageUrl: "",
  secondaryImageCredit: "Meomeo Library",
  secondaryImageCaption: "",
  paragraphsText: "",
  bodyHtml: "",
  isPublished: true,
};

const readingWordsPerMinute = 200;
const editorFontSizes = [
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "21", value: "21px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

function parseParagraphs(value) {
  return value
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function countWords(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getReadingStats(form) {
  const paragraphs = parseParagraphs(form.paragraphsText);
  const wordCount = countWords([form.summary, ...paragraphs].join(" "));
  const minutes = Math.max(1, Math.ceil(wordCount / readingWordsPerMinute));
  return { minutes, paragraphs, wordCount };
}

function toForm(reading) {
  if (!reading) return emptyForm;
  return {
    title: reading.title || "",
    slug: reading.slug || "",
    summary: reading.summary || "",
    author: reading.author || "Meo Meo English",
    authorRole: reading.authorRole || "Biên tập viên",
    level: reading.level || "TOEIC A2",
    publishedAt: reading.publishedAt ? new Date(reading.publishedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    imageUrl: reading.imageUrl || "",
    imageCredit: reading.imageCredit || "Meomeo Library",
    imageCaption: reading.imageCaption || "",
    secondaryImageUrl: reading.secondaryImageUrl || "",
    secondaryImageCredit: reading.secondaryImageCredit || "Meomeo Library",
    secondaryImageCaption: reading.secondaryImageCaption || "",
    paragraphsText: (reading.paragraphs || []).join("\n\n"),
    bodyHtml: reading.bodyHtml || "",
    isPublished: reading.isPublished ?? true,
  };
}

function toQuestionForm(question) {
  if (!question) return emptyQuestion;
  const choices = question.choices || [];
  return {
    prompt: question.prompt || "",
    choicesText: choices.join("\n"),
    answerIndex: Math.max(0, choices.findIndex((choice) => choice === question.answer)),
    explanation: question.explanation || "",
  };
}

function buildPayload(form, questions, editorHtml) {
  const paragraphsText = editorHtml
    ? editorHtml.replace(/<[^>]*>/g, "")
    : form.paragraphsText;

  return {
    title: form.title,
    slug: form.slug || undefined,
    summary: form.summary,
    author: form.author,
    authorRole: form.authorRole,
    level: form.level,
    publishedAt: form.publishedAt,
    imageUrl: form.imageUrl,
    imageCredit: form.imageCredit,
    imageCaption: form.imageCaption,
    secondaryImageUrl: form.secondaryImageUrl,
    secondaryImageCredit: form.secondaryImageCredit,
    secondaryImageCaption: form.secondaryImageCaption,
    paragraphs: parseParagraphs(paragraphsText),
    bodyHtml: editorHtml || form.bodyHtml || undefined,
    questions: questions
      .map((question) => {
        const choices = question.choicesText
          .split("\n")
          .map((choice) => choice.trim())
          .filter(Boolean);
        return {
          prompt: question.prompt,
          choices,
          answer: choices[Number(question.answerIndex)] || choices[0],
          explanation: question.explanation,
        };
      })
      .filter((question) => question.prompt && question.choices.length >= 2 && question.answer),
    isPublished: form.isPublished,
  };
}

function extractValidationMessages(error) {
  const errors = error?.response?.data?.errors;
  if (!errors) return [];

  const messages = [];
  if (Array.isArray(errors)) {
    messages.push(...errors.map((item) => item?.message).filter(Boolean));
  }
  if (errors.formErrors?.length) messages.push(...errors.formErrors);
  if (errors.fieldErrors) {
    for (const [field, fieldMessages] of Object.entries(errors.fieldErrors)) {
      for (const message of fieldMessages || []) {
        messages.push(`${field}: ${message}`);
      }
    }
  }

  return [...new Set(messages)];
}

export default function ReadingEditorDialog({ createReadingMutation, reading, trigger, updateReadingMutation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [draftReading, setDraftReading] = useState(null);
  const getEditorBodyFromReading = (r) => r?.bodyHtml || (r?.paragraphs || []).map((p) => `<p>${p}</p>`).join("") || "";
  const [editorBody, setEditorBody] = useState(() => getEditorBodyFromReading(reading));
  const isEditing = Boolean(reading?._id);
  const readingStats = useMemo(() => getReadingStats(form), [form]);
  const bodyEditorRef = useRef(null);
  const hydrationDoneRef = useRef(false);
  const savedEditorRangeRef = useRef(null);
  const activeReading = draftReading || reading;
  const editorHydrationKey = `${activeReading?._id || "new"}-${isOpen ? "open" : "closed"}`;

  useEffect(() => {
    if (!isOpen) return;
    setForm(toForm(activeReading));
    setQuestions(activeReading?.questions?.length ? activeReading.questions.map(toQuestionForm) : []);
    setEditorBody(getEditorBodyFromReading(activeReading));
    hydrationDoneRef.current = false;
  }, [activeReading, isOpen, reading]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const saveSelection = () => {
      const editor = bodyEditorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;
      savedEditorRangeRef.current = range.cloneRange();
    };

    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, [isOpen]);

  const setupBodyEditorRef = (node) => {
    bodyEditorRef.current = node;
    if (node && !hydrationDoneRef.current && editorBody) {
      node.innerHTML = editorBody;
      hydrationDoneRef.current = true;
    }
  };

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function appendParagraphTemplate(template = "") {
    const currentHtml = bodyEditorRef.current?.innerHTML || editorBody || "";
    const nextHtml = `${currentHtml.trim()}${currentHtml.trim() ? "\n\n" : ""}${template}`.trimStart();
    setEditorBody(nextHtml);
    setForm((current) => ({ ...current, paragraphsText: (bodyEditorRef.current?.textContent || current.paragraphsText || "") }));
    requestAnimationFrame(() => {
      if (bodyEditorRef.current) bodyEditorRef.current.innerHTML = nextHtml;
      bodyEditorRef.current?.focus();
      window.getSelection()?.collapseToEnd?.();
    });
  }

  function updateEditorStateFromDom() {
    const editor = bodyEditorRef.current;
    if (!editor) return;
    setEditorBody(editor.innerHTML || "");
    updateField("paragraphsText", editor.textContent || "");
  }

  function restoreEditorSelection() {
    const editor = bodyEditorRef.current;
    const range = savedEditorRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return null;

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
  }

  function formatSelectionAsNormalText() {
    const editor = bodyEditorRef.current;
    if (!editor) return;

    editor.focus();
    restoreEditorSelection();
    document.execCommand("removeFormat");
    document.execCommand("formatBlock", false, "p");
    updateEditorStateFromDom();
  }

  function applyFontSizeToSelection(fontSize) {
    const editor = bodyEditorRef.current;
    if (!editor || !fontSize) return;

    editor.focus();
    const range = restoreEditorSelection();
    if (!range || range.collapsed) return;

    const wrapper = document.createElement("span");
    wrapper.style.fontSize = fontSize;
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    const selection = window.getSelection();
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    savedEditorRangeRef.current = nextRange.cloneRange();
    updateEditorStateFromDom();
  }

  function generateSummary() {
    const firstParagraph = parseParagraphs(form.paragraphsText)[0] || "";
    updateField("summary", firstParagraph.split(" ").slice(0, 32).join(" "));
  }

  function updateQuestion(index, field, value) {
    setQuestions((current) => current.map((question, questionIndex) => (questionIndex === index ? { ...question, [field]: value } : question)));
  }

  async function submitReading(event) {
    event.preventDefault();
    const editorHtml = bodyEditorRef.current?.innerHTML || form.bodyHtml || "";
    const payload = buildPayload(form, questions, editorHtml);

    if (isEditing) {
      const response = await updateReadingMutation.mutateAsync({ id: reading._id, data: payload });
      setDraftReading(response?.data?.data?.reading || null);
    } else {
      const response = await createReadingMutation.mutateAsync(payload);
      setDraftReading(response?.data?.data?.reading || null);
    }

    setIsOpen(false);
  }

  const activeError =
    createReadingMutation.error?.response?.data?.message ||
    updateReadingMutation.error?.response?.data?.message ||
    "";
  const validationMessages = extractValidationMessages(createReadingMutation.error).concat(extractValidationMessages(updateReadingMutation.error));
  const isPending = createReadingMutation.isPending || updateReadingMutation.isPending;

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button">
            <FilePlus2 size={16} /> Viết bài mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bottom-2 left-2 right-2 top-2 max-h-none w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto overflow-x-hidden rounded-xl p-0 sm:bottom-4 sm:left-4 sm:right-4 sm:top-4">
        <DialogHeader className="sticky top-0 z-20 border-b border-[#e6dfd8] bg-canvas px-5 py-4 pr-12">
          <DialogTitle>{isEditing ? "Chỉnh sửa bài viết" : "Viết bài mới"}</DialogTitle>
          <DialogDescription>Soạn nội dung blog, thiết lập thông tin xuất bản và tạo câu hỏi đọc hiểu trong cùng một nơi.</DialogDescription>
        </DialogHeader>

        <form className="mx-auto w-full max-w-[1320px] space-y-6 p-4 sm:p-5" onSubmit={submitReading}>
          {activeError ? <Alert variant="error">{activeError}</Alert> : null}
          {validationMessages.length ? (
            <Alert variant="warning">
              <div className="space-y-1">
                <p className="font-semibold">Chi tiết validation</p>
                <ul className="list-disc space-y-1 pl-5">
                  {validationMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          ) : null}

          <section className="overflow-hidden rounded-xl border border-[#d8d0c6] bg-[#fbfaf6] shadow-[0_18px_60px_rgba(20,20,19,0.06)]">
            <div className="border-b border-[#e6dfd8] bg-canvas px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-ink-muted">Studio biên tập</h3>
                  <p className="mt-1 text-sm font-medium text-ink-muted">Quản lý thông tin, hình ảnh và nội dung bài viết trước khi xuất bản.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black text-ink-muted">
                  <span className="rounded-full bg-cream px-3 py-1">{readingStats.wordCount} từ</span>
                  <span className="rounded-full bg-cream px-3 py-1">{readingStats.paragraphs.length} đoạn</span>
                  <span className="rounded-full bg-cream px-3 py-1">{readingStats.minutes} phút đọc</span>
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-4 p-4 sm:p-5">
                <div className="rounded-lg border border-[#e6dfd8] bg-canvas p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Thông tin xuất bản</p>
                    <span className="rounded-full bg-cream-soft px-3 py-1 text-xs font-bold text-ink-muted">Cài đặt bài viết</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input onChange={(event) => updateField("title", event.target.value)} placeholder="Tiêu đề bài viết" required value={form.title} />
                    <Input onChange={(event) => updateField("slug", event.target.value)} placeholder="duong-dan-bai-viet" value={form.slug} />
                    <Input onChange={(event) => updateField("level", event.target.value)} placeholder="IELTS / TOEIC A2" value={form.level} />
                    <div className="flex h-10 items-center rounded-lg border border-[#d8d0c6] bg-cream-soft px-3.5 text-sm font-semibold text-ink-muted">
                      {readingStats.minutes} phút đọc, tự tính theo số từ
                    </div>
                    <Input onChange={(event) => updateField("author", event.target.value)} placeholder="Tên tác giả" value={form.author} />
                    <Input onChange={(event) => updateField("authorRole", event.target.value)} placeholder="Vai trò tác giả" value={form.authorRole} />
                    <Input onChange={(event) => updateField("publishedAt", event.target.value)} type="date" value={form.publishedAt} />
                    <label className="flex items-center gap-2 rounded-lg border border-[#d8d0c6] px-3 text-sm font-semibold">
                      <input checked={form.isPublished} onChange={(event) => updateField("isPublished", event.target.checked)} type="checkbox" />
                      Xuất bản bài viết
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e6dfd8] bg-canvas p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Mô tả ngắn</p>
                    <Button onClick={generateSummary} size="sm" type="button" variant="outline">
                      Tạo từ đoạn đầu
                    </Button>
                  </div>
                  <Textarea className="min-h-24 text-base leading-7" onChange={(event) => updateField("summary", event.target.value)} placeholder="Tóm tắt nội dung hiển thị trên danh sách bài viết" required value={form.summary} />
                </div>

                <div className="rounded-lg border border-[#e6dfd8] bg-canvas p-4 shadow-sm">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Hình ảnh</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input onChange={(event) => updateField("imageUrl", event.target.value)} placeholder="URL ảnh đại diện" required value={form.imageUrl} />
                    <Input onChange={(event) => updateField("imageCredit", event.target.value)} placeholder="Nguồn ảnh đại diện" value={form.imageCredit} />
                    <Input onChange={(event) => updateField("secondaryImageUrl", event.target.value)} placeholder="URL ảnh phụ" value={form.secondaryImageUrl} />
                    <Input onChange={(event) => updateField("secondaryImageCredit", event.target.value)} placeholder="Nguồn ảnh phụ" value={form.secondaryImageCredit} />
                  </div>
                  <Textarea className="mt-3" onChange={(event) => updateField("imageCaption", event.target.value)} placeholder="Chú thích ảnh đại diện" value={form.imageCaption} />
                  <Textarea className="mt-3" onChange={(event) => updateField("secondaryImageCaption", event.target.value)} placeholder="Chú thích ảnh phụ" value={form.secondaryImageCaption} />
                </div>

                <div className="flex h-[620px] min-w-0 flex-col overflow-hidden rounded-xl border border-[#ded8ce] bg-[#fffdf8] shadow-[0_18px_60px_rgba(20,20,19,0.08)] sm:h-[680px] xl:h-[calc(100vh-14rem)] xl:min-h-[560px]">
                  <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#eee8df] bg-[#fffdf8]/95 px-4 py-3 backdrop-blur">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d8d0c6] text-lg font-light text-ink-muted">+</span>
                      <span className="truncate text-xs font-black uppercase tracking-[0.14em] text-ink-muted">Nội dung bài viết</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={formatSelectionAsNormalText} size="sm" type="button" variant="ghost">
                        <RemoveFormatting size={15} /> Normal
                      </Button>
                      <select
                        aria-label="Cỡ chữ"
                        className="h-9 rounded-lg border border-transparent bg-transparent px-2 text-sm font-bold text-coal outline-none transition hover:bg-cream-soft focus:border-[#d8d0c6] focus:bg-white"
                        defaultValue=""
                        onChange={(event) => {
                          applyFontSizeToSelection(event.target.value);
                          event.target.value = "";
                        }}
                      >
                        <option value="">Cỡ chữ</option>
                        {editorFontSizes.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <Button onClick={() => appendParagraphTemplate("New paragraph...")} size="sm" type="button" variant="ghost">
                        <ListPlus size={15} /> Đoạn văn
                      </Button>
                      <Button onClick={() => appendParagraphTemplate("Subheading")} size="sm" type="button" variant="ghost">
                        <Heading2 size={15} /> Tiêu đề phụ
                      </Button>
                      <Button onClick={() => appendParagraphTemplate("“Pull quote or important idea.”")} size="sm" type="button" variant="ghost">
                        <Quote size={15} /> Trích dẫn
                      </Button>
                      <Button onClick={() => appendParagraphTemplate("![Image caption](https://example.com/image.jpg)")} size="sm" type="button" variant="ghost">
                        <ImagePlus size={15} /> Ghi chú ảnh
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="mx-auto min-w-0 max-w-[720px] px-5 py-8 sm:px-8">
                      <div className="mb-8 border-b border-[#eee8df] pb-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b8176]">{form.level || "Reading"}</p>
                        <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-[#242424] sm:text-5xl">
                          {form.title || "Tiêu đề bài viết"}
                        </h2>
                        <p className="mt-4 text-xl leading-8 text-[#6b6b6b]">
                          {form.summary || "Viết mô tả ngắn ở phía trên, sau đó bắt đầu soạn nội dung bên dưới."}
                        </p>
                      </div>

                      <div
                        aria-label="Article body editor"
                        className="medium-editor-body min-h-[420px] whitespace-pre-wrap pb-24 font-serif text-[21px] leading-[1.72] text-[#242424] outline-none empty:before:pointer-events-none empty:before:text-[#a8a29a] empty:before:content-[attr(data-placeholder)]"
                        contentEditable
                        data-placeholder="Bắt đầu viết nội dung..."
                        key={editorHydrationKey}
                        onInput={(event) => {
                          const nextHtml = event.currentTarget.innerHTML || "";
                          setEditorBody(nextHtml);
                          updateField("paragraphsText", event.currentTarget.textContent || "");
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          const selection = window.getSelection();
                          if (!selection.rangeCount) return;
                          const range = selection.getRangeAt(0);
                          range.deleteContents();
                          const breakNode = document.createTextNode("\n\n");
                          range.insertNode(breakNode);
                          range.setStartAfter(breakNode);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                          const editor = event.currentTarget;
                          setEditorBody(editor.innerHTML || "");
                          updateField("paragraphsText", editor.textContent || "");
                        }}
                        ref={setupBodyEditorRef}
                        role="textbox"
                        suppressContentEditableWarning
                      />
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hidden border-t border-[#e6dfd8] bg-canvas p-4 xl:block xl:border-l xl:border-t-0">
                <div className="sticky top-4 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Xem trước bài viết</p>
                    <h4 className="mt-2 line-clamp-3 text-2xl font-black leading-tight">{form.title || "Bài viết chưa có tiêu đề"}</h4>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-ink-muted">{form.summary || "Mô tả ngắn sẽ hiển thị tại đây."}</p>
                  </div>
                  {form.imageUrl ? (
                    <figure className="overflow-hidden rounded-xl border border-[#e6dfd8]">
                      <img alt="" className="aspect-[16/10] w-full object-cover" src={form.imageUrl} />
                      <figcaption className="bg-cream-soft px-3 py-2 text-xs font-semibold text-ink-muted">{form.imageCaption || form.imageCredit}</figcaption>
                    </figure>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft text-sm font-bold text-ink-muted">
                      Xem trước ảnh đại diện
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-cream-soft p-3">
                      <p className="text-lg font-black">{readingStats.wordCount}</p>
                      <p className="text-[11px] font-bold uppercase text-ink-muted">Từ</p>
                    </div>
                    <div className="rounded-xl bg-cream-soft p-3">
                      <p className="text-lg font-black">{readingStats.paragraphs.length}</p>
                      <p className="text-[11px] font-bold uppercase text-ink-muted">Đoạn</p>
                    </div>
                    <div className="rounded-xl bg-cream-soft p-3">
                      <p className="text-lg font-black">{readingStats.minutes}</p>
                      <p className="text-[11px] font-bold uppercase text-ink-muted">Phút</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="rounded-xl border border-[#d8d0c6] bg-canvas p-4 shadow-[0_12px_36px_rgba(20,20,19,0.05)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-ink-muted">Câu hỏi đọc hiểu</h3>
                <p className="mt-1 text-sm font-medium text-ink-muted">Tạo câu hỏi đọc hiểu riêng, mỗi đáp án một dòng và chọn đáp án đúng bằng số thứ tự.</p>
              </div>
              <Button onClick={() => setQuestions((current) => [...current, emptyQuestion])} size="sm" type="button" variant="outline">
                <Plus size={15} /> Thêm câu hỏi
              </Button>
            </div>

            <div className="mt-5 grid gap-4">
              {!questions.length ? (
                <div className="rounded-lg border border-dashed border-[#d8d0c6] bg-[#fbfaf6] px-4 py-8 text-center">
                  <p className="text-sm font-bold text-coal">Chưa có câu hỏi nào</p>
                  <p className="mt-1 text-sm font-medium text-ink-muted">Blog sẽ mặc định không hiển thị phần câu hỏi đọc hiểu.</p>
                </div>
              ) : null}
              {questions.map((question, index) => {
                const choiceCount = question.choicesText.split("\n").filter((choice) => choice.trim()).length || 1;
                return (
                  <div className="rounded-lg border border-[#e6dfd8] bg-[#fbfaf6] p-4 shadow-sm" key={index}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-coal px-2 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm font-black">Câu hỏi {index + 1}</p>
                      </div>
                      <Button
                        onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 size={14} /> Xoá
                      </Button>
                    </div>
                    <Textarea className="mt-4 min-h-20 bg-canvas text-base font-semibold leading-7" onChange={(event) => updateQuestion(index, "prompt", event.target.value)} placeholder="Nội dung câu hỏi" value={question.prompt} />
                    <Textarea
                      className="mt-3 min-h-32 bg-canvas font-mono text-sm leading-6"
                      onChange={(event) => updateQuestion(index, "choicesText", event.target.value)}
                      placeholder="Mỗi dòng là một đáp án"
                      value={question.choicesText}
                    />
                    <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
                      <Input
                        max={Math.max(1, choiceCount)}
                        min="1"
                        onChange={(event) => updateQuestion(index, "answerIndex", Number(event.target.value) - 1)}
                        type="number"
                        value={Number(question.answerIndex) + 1}
                      />
                      <Input onChange={(event) => updateQuestion(index, "explanation", event.target.value)} placeholder="Giải thích đáp án (không bắt buộc)" value={question.explanation} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
              Huỷ
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <Spinner size="sm" /> : isEditing ? <Edit3 size={16} /> : <FilePlus2 size={16} />}
              {isPending ? "Đang lưu..." : isEditing ? "Lưu bài viết" : "Xuất bản bài viết"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
