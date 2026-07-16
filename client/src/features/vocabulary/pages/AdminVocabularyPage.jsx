import {
  ArrowLeft,
  BookOpenText,
  Bot,
  Check,
  ChevronRight,
  CirclePlus,
  CloudCog,
  Edit3,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Layers3,
  LoaderCircle,
  PencilLine,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { lessonTypes } from "../data/dailyVocabulary.js";
import { useVocabularyAdminMutations, useVocabularyCourses, useVocabularyExercises, useVocabularyItems } from "../hooks/useVocabularyAdmin.js";

const ELEVEN_CONFIG_KEY = "meomeo_elevenlabs_session_config";
const lessonIcons = { flashcards: Layers3, "match-meaning": BookOpenText, "listening-fill": PencilLine, "cloze-quiz": Headphones };
const lessonDefaults = Object.fromEntries(lessonTypes.map((lesson) => [lesson.id, lesson]));

function readElevenConfig() {
  try {
    return JSON.parse(sessionStorage.getItem(ELEVEN_CONFIG_KEY)) || { apiKey: "", voiceId: "JBFqnCBsd6RMkjVDRZzb", model: "eleven_multilingual_v2" };
  } catch {
    return { apiKey: "", voiceId: "JBFqnCBsd6RMkjVDRZzb", model: "eleven_multilingual_v2" };
  }
}

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || "Không thể hoàn tất thao tác.";
}

function stripReconstructionInstruction(value) {
  const text = String(value || "").trim();
  const match = text.match(/^reconstruct the sentence:\s*(.+?)(?:\s*\(.*?\))?\.?$/i);
  return match ? match[1].trim() : text;
}

function isLikelySingleTerm(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length <= 3;
}

function Field({ children, label }) {
  return <label className="grid gap-1.5 text-xs font-bold text-ink-muted"><span>{label}</span>{children}</label>;
}

function AudioPreviewButton({ audioUrl, text }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  function speakWithBrowserVoice() {
    if (!("speechSynthesis" in window)) {
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === "en-US") || voices.find((voice) => voice.lang.startsWith("en")) || null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.85;
    utterance.volume = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  async function toggleAudio() {
    if (isPlaying) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    if (!audioUrl) {
      speakWithBrowserVoice();
      return;
    }

    try {
      const audio = new Audio(audioUrl);
      audio.volume = 1;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        audioRef.current = null;
        speakWithBrowserVoice();
      };
      await audio.play();
    } catch {
      audioRef.current = null;
      speakWithBrowserVoice();
    }
  }

  return (
    <button
      aria-label={isPlaying ? `Dừng phát âm ${text}` : `Nghe phát âm ${text}`}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-bold ${isPlaying ? "border-coral bg-coral text-white" : "border-[#e6dfd8] bg-cream-soft text-coral"}`}
      onClick={toggleAudio}
      type="button"
    >
      {isPlaying ? <Pause size={13} /> : <Volume2 size={13} />}
      {isPlaying ? "Đang phát" : "Nghe"}
    </button>
  );
}

function AdminToast({ message, onClose, type = "success" }) {
  if (!message) return null;
  return (
    <div className={`fixed left-1/2 top-5 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${type === "error" ? "bg-red-100" : "bg-emerald-100"}`}>{type === "error" ? <X size={15} /> : <Check size={16} />}</span>
      <span className="min-w-0 flex-1">{message}</span>
      <button aria-label="Đóng thông báo" onClick={onClose} type="button"><X size={16} /></button>
    </div>
  );
}

function CourseDialog({ course, mutation, onClose, onCreated, open }) {
  const [form, setForm] = useState({ title: "", description: "", level: "beginner", isPublished: false });
  useEffect(() => {
    setForm(course ? { title: course.title, description: course.description || "", level: course.level || "beginner", isPublished: Boolean(course.isPublished) } : { title: "", description: "", level: "beginner", isPublished: false });
  }, [course, open]);

  async function submit(event) {
    event.preventDefault();
    const response = course ? await mutation.mutateAsync({ id: course._id, data: form }) : await mutation.mutateAsync(form);
    onCreated?.(response?.data?.data?.course);
    onClose();
  }

  return (
    <Dialog onOpenChange={(next) => !next && onClose()} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{course ? "Chỉnh sửa bài học" : "Tạo bài học mới"}</DialogTitle>
          <DialogDescription>Mỗi bài mới tự có sẵn 4 bài: flashcard, ghép cặp, viết lại câu và nghe đục lỗ.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Tên bài học"><Input autoFocus onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ví dụ: Daily Routine" required value={form.title} /></Field>
          <Field label="Tiêu đề phụ"><Textarea onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả ngắn nội dung người học sẽ nắm được" value={form.description} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trình độ">
              <Select onValueChange={(value) => setForm({ ...form, level: value })} value={form.level}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select>
            </Field>
            <label className="flex items-center gap-3 self-end rounded-lg border border-[#e6dfd8] px-3.5 py-2.5 text-sm font-semibold"><input checked={form.isPublished} className="h-4 w-4 accent-coral" onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} type="checkbox" /> Xuất bản sau khi lưu</label>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button onClick={onClose} type="button" variant="outline">Huỷ</Button><Button disabled={mutation.isPending} type="submit">{mutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{course ? "Lưu thay đổi" : "Tạo bài học"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const blankItem = { word: "", phonetic: "", partOfSpeech: "other", meaningVi: "", meaningEn: "", example: "", exampleMeaningVi: "", collocations: "", difficulty: "easy", isPublished: true };

function ItemDialog({ courseId, item, mutation, onClose, open }) {
  const [form, setForm] = useState(blankItem);
  useEffect(() => setForm(item ? { ...item, collocations: (item.collocations || []).join(", ") } : blankItem), [item, open]);

  async function submit(event) {
    event.preventDefault();
    const data = {
      word: form.word,
      phonetic: form.phonetic || "",
      partOfSpeech: form.partOfSpeech || "other",
      meaningVi: form.meaningVi,
      meaningEn: form.meaningEn || "",
      example: form.example || "",
      exampleMeaningVi: form.exampleMeaningVi || "",
      collocations: form.collocations.split(",").map((value) => value.trim()).filter(Boolean),
      difficulty: form.difficulty || "easy",
      isPublished: Boolean(form.isPublished),
    };
    await mutation.mutateAsync(item ? { itemId: item._id, courseId, data } : { courseId, data });
    onClose();
  }

  return (
    <Dialog onOpenChange={(next) => !next && onClose()} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{item ? "Chỉnh sửa flashcard" : "Thêm flashcard thủ công"}</DialogTitle><DialogDescription>Nội dung này được dùng lại cho cả bốn bài học.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Từ hoặc cụm từ"><Input autoFocus required value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} /></Field><Field label="IPA"><Input placeholder="/ˈeksəmpəl/" value={form.phonetic} onChange={(e) => setForm({ ...form, phonetic: e.target.value })} /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nghĩa tiếng Việt"><Input required value={form.meaningVi} onChange={(e) => setForm({ ...form, meaningVi: e.target.value })} /></Field><Field label="Định nghĩa tiếng Anh"><Input value={form.meaningEn} onChange={(e) => setForm({ ...form, meaningEn: e.target.value })} /></Field></div>
          <Field label="Câu ví dụ tiếng Anh"><Input value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} /></Field>
          <Field label="Dịch câu ví dụ"><Input value={form.exampleMeaningVi} onChange={(e) => setForm({ ...form, exampleMeaningVi: e.target.value })} /></Field>
          <Field label="Collocation (ngăn cách bằng dấu phẩy)"><Input placeholder="daily routine, morning routine" value={form.collocations} onChange={(e) => setForm({ ...form, collocations: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Từ loại"><Select value={form.partOfSpeech} onValueChange={(value) => setForm({ ...form, partOfSpeech: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["noun", "verb", "adjective", "adverb", "phrase", "other"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Độ khó"><Select value={form.difficulty} onValueChange={(value) => setForm({ ...form, difficulty: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent></Select></Field></div>
          <label className="flex items-center gap-3 text-sm font-semibold"><input checked={form.isPublished} className="h-4 w-4 accent-coral" onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} type="checkbox" /> Hiển thị cho người học</label>
          <div className="flex justify-end gap-2"><Button onClick={onClose} type="button" variant="outline">Huỷ</Button><Button disabled={mutation.isPending} type="submit"><Save size={16} /> Lưu flashcard</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AiFlashcardBuilder({ course, items, mutation, notify }) {
  const [words, setWords] = useState("");
  const [provider, setProvider] = useState("openai");
  const [voice, setVoice] = useState("coral");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [eleven, setEleven] = useState(readElevenConfig);
  const wordList = useMemo(() => words.split(/[\n,;]+/).map((word) => word.trim()).filter(Boolean), [words]);

  function saveElevenConfig() {
    sessionStorage.setItem(ELEVEN_CONFIG_KEY, JSON.stringify(eleven));
    setShowConfig(false);
    notify("Đã lưu cấu hình ElevenLabs cho phiên làm việc này.");
  }

  async function generate() {
    if (!wordList.length) return;
    if (provider === "elevenlabs" && !eleven.apiKey) {
      setShowConfig(true);
      notify("Nhập API key ElevenLabs trước khi tạo audio.", "error");
      return;
    }
    const response = await mutation.mutateAsync({ courseId: course._id, data: { words: wordList, generateAudio, audioProvider: provider, openAiVoice: voice, elevenLabs: provider === "elevenlabs" ? eleven : undefined, startOrder: items.length, isPublished: true } });
    const data = response.data.data;
    setWords("");
    notify(`Đã tạo ${data.createdCount} flashcard${generateAudio ? " và xử lý audio" : ""}.`);
  }

  return (
    <div className="rounded-xl border border-[#dcd1ff] bg-[#faf8ff] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6] text-white"><WandSparkles size={19} /></span><div><h3 className="font-display text-lg font-semibold">Tạo flashcard bằng AI</h3><p className="mt-1 text-sm text-ink-muted">Nhập một từ hoặc cụm từ mỗi dòng. AI tự tạo nghĩa, IPA, ví dụ và collocation.</p></div></div><Button onClick={() => setShowConfig(!showConfig)} size="sm" type="button" variant="outline"><KeyRound size={15} /> ElevenLabs</Button></div>
      {showConfig ? <div className="mt-4 grid gap-3 rounded-lg border border-[#e6dfd8] bg-white p-4 sm:grid-cols-2"><Field label="API key"><Input autoComplete="off" onChange={(e) => setEleven({ ...eleven, apiKey: e.target.value })} placeholder="sk_..." type="password" value={eleven.apiKey} /></Field><Field label="Voice ID"><Input onChange={(e) => setEleven({ ...eleven, voiceId: e.target.value })} value={eleven.voiceId} /></Field><Field label="Model"><Input onChange={(e) => setEleven({ ...eleven, model: e.target.value })} value={eleven.model} /></Field><div className="flex items-end"><Button className="w-full" onClick={saveElevenConfig} type="button" variant="secondary"><Save size={15} /> Lưu trong phiên</Button></div><p className="sm:col-span-2 text-xs leading-5 text-ink-muted">Key chỉ lưu trong sessionStorage và tự xoá khi đóng tab. Server không lưu key vào database.</p></div> : null}
      <Textarea className="mt-4 min-h-32 bg-white" onChange={(e) => setWords(e.target.value)} placeholder={"routine\ncommute\nprepare\ndaily schedule"} value={words} />
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select onValueChange={setProvider} value={provider}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai">OpenAI TTS</SelectItem><SelectItem value="elevenlabs">ElevenLabs</SelectItem></SelectContent></Select>
        {provider === "openai" ? <Select onValueChange={setVoice} value={voice}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{["coral", "marin", "cedar", "alloy", "nova", "shimmer"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select> : <div className="flex items-center rounded-lg border border-[#e6dfd8] bg-white px-3 text-sm font-semibold text-ink-muted">Voice: {eleven.voiceId ? `${eleven.voiceId.slice(0, 8)}...` : "Chưa cấu hình"}</div>}
        <Button disabled={!wordList.length || mutation.isPending} onClick={generate} type="button">{mutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />} Tạo {wordList.length || ""} thẻ</Button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input checked={generateAudio} className="h-4 w-4 accent-coral" onChange={(e) => setGenerateAudio(e.target.checked)} type="checkbox" /> Tạo audio ngay sau khi tạo flashcard</label>
    </div>
  );
}

function FlashcardWorkspace({ course, mutations, notify }) {
  const { data: items = [], isLoading } = useVocabularyItems(course._id);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [audioProvider, setAudioProvider] = useState("openai");
  const missingAudioItems = items.filter((item) => !item.audioUrl || (item.example && !item.exampleAudioUrl));

  async function remove(item) {
    if (!window.confirm(`Xoá flashcard “${item.word}”?`)) return;
    await mutations.deleteItem.mutateAsync({ itemId: item._id, courseId: course._id });
    notify("Đã xoá flashcard.");
  }

  async function createAudio(item) {
    const eleven = readElevenConfig();
    if (audioProvider === "elevenlabs" && !eleven.apiKey) return notify("Hãy cấu hình ElevenLabs trong khối tạo bằng AI trước.", "error");
    await mutations.generateAudio.mutateAsync({ itemId: item._id, courseId: course._id, data: { force: true, provider: audioProvider, voice: "coral", elevenLabs: audioProvider === "elevenlabs" ? eleven : undefined } });
    notify(`Đã tạo lại audio từ vựng và ví dụ cho “${item.word}”.`);
  }

  async function createMissingAudio() {
    const eleven = readElevenConfig();
    if (audioProvider === "elevenlabs" && !eleven.apiKey) {
      notify("Hãy mở cấu hình ElevenLabs phía trên và nhập API key trước.", "error");
      return;
    }

    try {
      const response = await mutations.generateCourseAudio.mutateAsync({
        courseId: course._id,
        data: {
          force: false,
          provider: audioProvider,
          voice: "coral",
          elevenLabs: audioProvider === "elevenlabs" ? eleven : undefined,
          limit: 100,
        },
      });
      const result = response.data.data;
      if (result.failedCount) {
        notify(`Đã tạo ${result.generatedCount} audio, ${result.failedCount} thẻ bị lỗi.`, "error");
      } else {
        notify(`Đã tạo audio cho ${result.generatedCount} flashcard.`);
      }
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  return (
    <div className="grid gap-5">
      <AiFlashcardBuilder course={course} items={items} mutation={mutations.generateItems} notify={notify} />
      {missingAudioItems.length ? (
        <div className="flex flex-col gap-4 rounded-xl border border-[#b9def5] bg-[#f2faff] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1cb0f6] text-white"><Headphones size={19} /></span>
            <div>
              <h3 className="font-display text-lg font-semibold">Flashcard chưa đủ audio</h3>
              <p className="mt-1 text-sm leading-5 text-ink-muted">Còn {missingAudioItems.length} thẻ thiếu audio từ vựng hoặc câu ví dụ. Tạo hàng loạt bằng provider đang chọn bên dưới.</p>
            </div>
          </div>
          <Button className="shrink-0" disabled={mutations.generateCourseAudio.isPending} onClick={createMissingAudio} type="button">
            {mutations.generateCourseAudio.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Volume2 size={16} />}
            Tạo audio cho {missingAudioItems.length} thẻ
          </Button>
        </div>
      ) : items.length ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100"><Check size={15} /></span>Tất cả flashcard và ví dụ đã có audio.</div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">Danh sách flashcard</h2><p className="mt-1 text-sm text-ink-muted">{items.length} thẻ đang có trong bài học. Collocation chỉ là nội dung bổ sung, không tính thành thẻ riêng.</p></div><div className="flex gap-2"><Select value={audioProvider} onValueChange={setAudioProvider}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai">OpenAI audio</SelectItem><SelectItem value="elevenlabs">ElevenLabs</SelectItem></SelectContent></Select><Button onClick={() => { setEditing(null); setDialogOpen(true); }} type="button"><Plus size={16} /> Thêm thủ công</Button></div></div>
      {isLoading ? <LoadingState label="Đang tải flashcard..." /> : null}
      {!isLoading && !items.length ? <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft/30 text-center"><Layers3 className="text-coral" size={24} /><p className="mt-3 font-bold">Chưa có flashcard</p><p className="mt-1 text-sm text-ink-muted">Nhập danh sách từ vào AI hoặc thêm thủ công.</p></div> : null}
      <div className="grid gap-3 xl:grid-cols-2">{items.map((item, index) => <article className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border border-[#e6dfd8] bg-white p-4 shadow-sm" key={item._id}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-soft text-xs font-black text-coral">{index + 1}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black">{item.word}</h3>{item.generatedByAi ? <span className="rounded-full bg-[#eee7ff] px-2 py-0.5 text-[10px] font-black uppercase text-[#6d43d6]">AI</span> : null}{!item.audioUrl ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black uppercase text-sky-700">Thiếu audio từ</span> : null}{item.example && !item.exampleAudioUrl ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">Thiếu audio ví dụ</span> : null}</div><div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-ink-muted">{item.phonetic} · {item.partOfSpeech}</p><AudioPreviewButton audioUrl={item.audioUrl} text={item.word} /></div><p className="mt-2 text-sm font-bold">{item.meaningVi}</p><div className="mt-1 flex min-w-0 flex-wrap items-center gap-2"><p className="line-clamp-2 min-w-0 flex-1 text-sm text-ink-muted">{item.example}</p>{item.example ? <AudioPreviewButton audioUrl={item.exampleAudioUrl} text={item.example} /> : null}</div>{item.collocations?.length ? <div className="mt-2 flex flex-wrap gap-1">{item.collocations.map((value) => <span className="rounded-md bg-cream-soft px-2 py-1 text-xs font-semibold" key={value}>{value}</span>)}</div> : null}</div><div className="flex flex-col gap-1"><Button aria-label="Tạo lại audio từ và ví dụ" disabled={mutations.generateAudio.isPending} onClick={() => createAudio(item)} size="icon" title="Tạo lại audio từ và ví dụ" type="button" variant="ghost">{mutations.generateAudio.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}</Button><Button aria-label="Sửa" onClick={() => { setEditing(item); setDialogOpen(true); }} size="icon" type="button" variant="ghost"><Edit3 size={16} /></Button><Button aria-label="Xoá" className="text-red-600" onClick={() => remove(item)} size="icon" type="button" variant="ghost"><Trash2 size={16} /></Button></div></article>)}</div>
      <ItemDialog courseId={course._id} item={editing} mutation={editing ? mutations.updateItem : mutations.createItem} onClose={() => setDialogOpen(false)} open={dialogOpen} />
    </div>
  );
}

const blankQuestion = { prompt: "", sentence: "", answer: "", translation: "", options: "" };

function ExerciseWorkspace({ course, lessonKey, mutations, notify }) {
  const { data: exercises = [], isLoading } = useVocabularyExercises(course._id);
  const { data: flashcardItems = [], isLoading: isLoadingFlashcards } = useVocabularyItems(course._id);
  const current = exercises.find((item) => item.lessonKey === lessonKey);
  const lesson = lessonDefaults[lessonKey];
  const [title, setTitle] = useState(lesson?.title || "");
  const [instructions, setInstructions] = useState(lesson?.description || "");
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [questionForm, setQuestionForm] = useState(blankQuestion);
  const [audioProvider, setAudioProvider] = useState("openai");
  const [voice, setVoice] = useState("coral");
  const flashcardCount = flashcardItems.length;

  useEffect(() => {
    setTitle(current?.title || lesson?.title || "");
    setInstructions(current?.instructions || lesson?.description || "");
    setQuestions(current?.questions || []);
  }, [current, lesson]);

  async function save() {
    await mutations.saveExercise.mutateAsync({ courseId: course._id, lessonKey, data: { title, instructions, questions, settings: current?.settings || {}, isPublished: true } });
    notify("Đã lưu nội dung bài học.");
  }

  async function generate() {
    const eleven = readElevenConfig();
    if (lessonKey === "cloze-quiz" && audioProvider === "elevenlabs" && !eleven.apiKey) {
      notify("Hãy cấu hình ElevenLabs trong khối tạo flashcard trước khi tạo audio bài nghe.", "error");
      return;
    }
    const response = await mutations.generateExercise.mutateAsync({
      courseId: course._id,
      lessonKey,
      data: {
        title,
        instructions,
        isPublished: true,
        audioProvider,
        openAiVoice: voice,
        elevenLabs: lessonKey === "cloze-quiz" && audioProvider === "elevenlabs" ? eleven : undefined,
      },
    });
    const generatedCount = response.data.data.exercise?.questions?.length || flashcardCount;
    notify(`AI đã tạo ${generatedCount} câu${lessonKey === "cloze-quiz" ? " và audio nghe" : ""}.`);
  }

  function openQuestion(question, index) {
    setEditingIndex(index);
    setQuestionForm(question ? { ...question, prompt: stripReconstructionInstruction(question.prompt), options: (question.options || []).join(", ") } : blankQuestion);
  }

  function commitQuestion(event) {
    event.preventDefault();
    const value = { ...questionForm, options: questionForm.options.split(",").map((item) => item.trim()).filter(Boolean) };
    setQuestions((currentQuestions) => editingIndex === -1 ? [...currentQuestions, value] : currentQuestions.map((item, index) => index === editingIndex ? value : item));
    setEditingIndex(null);
  }

  if (isLoading || isLoadingFlashcards) return <LoadingState label="Đang tải nội dung bài..." />;

  if (lessonKey === "match-meaning") {
    return (
      <div className="grid gap-4 rounded-xl border border-[#cfe8d5] bg-[#f6fff8] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white"><Check size={19} /></span>
          <div>
            <h2 className="font-display text-xl font-semibold">Bài ghép cặp được tạo tự động</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">Không cần tạo câu hỏi bằng AI. Hệ thống lấy toàn bộ thẻ từ Bài 1, cho mỗi thẻ xuất hiện 3 lần và tự chia 3 cặp trong mỗi câu.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-100 bg-white p-4"><p className="text-xs font-black uppercase text-ink-muted">Flashcard</p><p className="mt-1 text-2xl font-black">{flashcardCount}</p></div>
          <div className="rounded-lg border border-emerald-100 bg-white p-4"><p className="text-xs font-black uppercase text-ink-muted">Số câu</p><p className="mt-1 text-2xl font-black">{flashcardCount}</p></div>
          <div className="rounded-lg border border-emerald-100 bg-white p-4"><p className="text-xs font-black uppercase text-ink-muted">Mỗi thẻ xuất hiện</p><p className="mt-1 text-2xl font-black">3 lần</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 rounded-xl border border-[#d7e9ff] bg-[#f7fbff] p-4 sm:p-5 lg:grid-cols-[1fr_240px]">
        <div className="grid gap-4"><div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1cb0f6] text-white"><Bot size={19} /></span><div><h2 className="font-display text-xl font-semibold">Tạo bài bằng AI</h2><p className="mt-1 text-sm leading-6 text-ink-muted">AI dùng toàn bộ flashcard để tạo đúng {flashcardCount} câu. {lessonKey === "cloze-quiz" ? "Bài nghe đục lỗ sẽ tạo audio bằng AI cho từng câu." : "Nội dung sinh ra vẫn chỉnh sửa được từng câu."}</p></div></div>{lessonKey === "cloze-quiz" ? <div className="grid gap-3 sm:grid-cols-2"><Select onValueChange={setAudioProvider} value={audioProvider}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="openai">OpenAI TTS</SelectItem><SelectItem value="elevenlabs">ElevenLabs</SelectItem></SelectContent></Select>{audioProvider === "openai" ? <Select onValueChange={setVoice} value={voice}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{["coral", "marin", "cedar", "alloy", "nova", "shimmer"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select> : <div className="flex items-center rounded-lg border border-[#e6dfd8] bg-white px-3 text-sm font-semibold text-ink-muted">Voice: {readElevenConfig().voiceId ? `${readElevenConfig().voiceId.slice(0, 8)}...` : "Chưa cấu hình"}</div>}</div> : null}</div>
        <div className="grid gap-2"><div className="rounded-lg border border-[#c9dff4] bg-white px-3 py-2"><p className="text-[11px] font-black uppercase text-ink-muted">Số câu tự động</p><p className="mt-0.5 text-lg font-black">{flashcardCount} câu</p></div><Button disabled={!flashcardCount || mutations.generateExercise.isPending} onClick={generate} type="button">{mutations.generateExercise.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />} Tạo nội dung</Button></div>
      </div>
      <div className="grid gap-4 rounded-xl border border-[#e6dfd8] bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">Cấu hình bài</h3><p className="mt-1 text-sm text-ink-muted">{questions.length} câu hỏi · {current?.generatedByAi ? "Khởi tạo bằng AI" : "Nội dung thủ công"}</p></div><Button disabled={mutations.saveExercise.isPending} onClick={save} type="button"><Save size={16} /> Lưu thay đổi</Button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Tên bài"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Hướng dẫn"><Input value={instructions} onChange={(e) => setInstructions(e.target.value)} /></Field></div></div>
      <div className="flex items-center justify-between"><h3 className="font-display text-2xl font-semibold">Câu hỏi</h3><Button onClick={() => openQuestion(null, -1)} type="button" variant="outline"><CirclePlus size={16} /> Thêm câu</Button></div>
      {!questions.length ? <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft/25"><PencilLine className="text-coral" size={23} /><p className="mt-3 font-bold">Chưa có câu hỏi</p><p className="mt-1 text-sm text-ink-muted">Tạo bằng AI hoặc thêm câu thủ công.</p></div> : <div className="grid gap-3">{questions.map((question, index) => { const cleanPrompt = stripReconstructionInstruction(question.prompt); const sourceItem = flashcardItems[index]; const useExampleSentence = lessonKey === "listening-fill" && sourceItem?.example && sourceItem?.exampleMeaningVi && (isLikelySingleTerm(cleanPrompt) || isLikelySingleTerm(question.answer)); const displayPrompt = useExampleSentence ? (index % 2 === 0 ? sourceItem.exampleMeaningVi : sourceItem.example) : cleanPrompt; const displayAnswer = useExampleSentence ? (index % 2 === 0 ? sourceItem.example : sourceItem.exampleMeaningVi) : question.answer; const displayDirection = useExampleSentence ? (index % 2 === 0 ? "Việt → Anh" : "Anh → Việt") : question.translation; return <article className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-xl border border-[#e6dfd8] bg-white p-4" key={`${question.prompt}-${index}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-soft text-xs font-black text-coral">{index + 1}</span><div className="min-w-0"><div className="flex flex-wrap items-start gap-2"><p className="min-w-0 flex-1 font-bold">{displayPrompt || question.sentence || "Câu hỏi chưa có nội dung"}</p>{lessonKey === "cloze-quiz" && displayPrompt ? <AudioPreviewButton audioUrl={question.audioUrl} text={displayPrompt} /> : null}</div>{question.sentence && displayPrompt ? <p className="mt-1 text-sm text-ink-muted">{question.sentence}</p> : null}<p className="mt-2 text-sm"><span className="font-bold text-emerald-700">Đáp án:</span> {displayAnswer}</p>{displayDirection ? <p className="mt-1 text-sm text-ink-muted">{displayDirection}</p> : null}{question.audioError ? <p className="mt-1 text-xs font-bold text-red-600">Audio lỗi: {question.audioError}</p> : null}</div><div className="flex gap-1"><Button aria-label="Sửa câu" onClick={() => openQuestion(question, index)} size="icon" type="button" variant="ghost"><Edit3 size={16} /></Button><Button aria-label="Xoá câu" className="text-red-600" onClick={() => setQuestions(questions.filter((_, itemIndex) => itemIndex !== index))} size="icon" type="button" variant="ghost"><Trash2 size={16} /></Button></div></article>; })}</div>}
      <Dialog onOpenChange={(open) => !open && setEditingIndex(null)} open={editingIndex !== null}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{editingIndex === -1 ? "Thêm câu hỏi" : "Chỉnh sửa câu hỏi"}</DialogTitle><DialogDescription>Các trường không dùng ở loại bài này có thể để trống.</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={commitQuestion}><Field label="Đề bài / câu phát âm"><Textarea required value={questionForm.prompt} onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })} /></Field><Field label="Câu có chỗ trống hoặc nội dung phụ"><Input placeholder="I ___ by bus every morning." value={questionForm.sentence} onChange={(e) => setQuestionForm({ ...questionForm, sentence: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Đáp án"><Input required value={questionForm.answer} onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })} /></Field><Field label="Bản dịch / hướng dẫn"><Input value={questionForm.translation} onChange={(e) => setQuestionForm({ ...questionForm, translation: e.target.value })} /></Field></div><Field label="Lựa chọn (ngăn cách bằng dấu phẩy)"><Input value={questionForm.options} onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })} /></Field><div className="flex justify-end gap-2"><Button onClick={() => setEditingIndex(null)} type="button" variant="outline">Huỷ</Button><Button type="submit"><Check size={16} /> Áp dụng</Button></div></form></DialogContent></Dialog>
    </div>
  );
}

export default function AdminVocabularyPage() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading, isError, error } = useVocabularyCourses();
  const mutations = useVocabularyAdminMutations();
  const [selectedId, setSelectedId] = useState(null);
  const [activeLesson, setActiveLesson] = useState("flashcards");
  const [courseDialog, setCourseDialog] = useState({ open: false, course: null });
  const [toast, setToast] = useState(null);
  const selected = courses.find((course) => course._id === selectedId) || courses[0];

  useEffect(() => { if (!selectedId && courses[0]) setSelectedId(courses[0]._id); }, [courses, selectedId]);
  function notify(message, type = "success") { setToast({ message, type }); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(null), 4200); }

  async function removeCourse() {
    if (!selected || !window.confirm(`Xoá bài “${selected.title}” và toàn bộ flashcard?`)) return;
    await mutations.deleteCourse.mutateAsync(selected._id);
    setSelectedId(null);
    notify("Đã xoá bài học.");
  }

  async function toggleCourse() {
    await mutations.toggleCourse.mutateAsync(selected._id);
    notify(selected.isPublished ? "Đã chuyển bài về bản nháp." : "Đã xuất bản bài học.");
  }

  const stats = { total: courses.length, published: courses.filter((course) => course.isPublished).length, drafts: courses.filter((course) => !course.isPublished).length };

  return (
    <section className="min-h-full bg-canvas px-4 py-7 text-coal sm:px-6 lg:px-10 lg:py-9">
      <AdminToast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
      <div className="mx-auto max-w-[1500px]">
        <Button onClick={() => navigate("/vocabulary")} size="sm" type="button" variant="ghost"><ArrowLeft size={16} /> Trang học từ vựng</Button>
        <header className="mt-4 flex flex-col gap-5 border-b border-[#e6dfd8] pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Từ vựng · Admin</p><h1 className="mt-2 font-display text-4xl font-normal sm:text-5xl">Xưởng bài học</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Tạo flashcard và bốn bài luyện tập bằng AI, sau đó kiểm duyệt và chỉnh từng nội dung trước khi xuất bản.</p></div><Button onClick={() => setCourseDialog({ open: true, course: null })} size="lg" type="button"><Plus size={18} /> Tạo bài học</Button></header>
        <div className="grid grid-cols-3 border-b border-[#e6dfd8]">{[["Tổng bài", stats.total], ["Đã xuất bản", stats.published], ["Bản nháp", stats.drafts]].map(([label, value], index) => <div className={`py-4 ${index ? "border-l border-[#e6dfd8] pl-5" : ""}`} key={label}><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-ink-muted">{label}</p></div>)}</div>
        {isLoading ? <LoadingState className="mt-12" label="Đang tải bài học..." /> : null}
        {isError ? <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{errorMessage(error)}</p> : null}
        {!isLoading && !isError ? <div className="mt-7 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="self-start rounded-xl border border-[#e6dfd8] bg-white p-2 lg:sticky lg:top-5"><div className="flex items-center justify-between px-2 py-2"><h2 className="text-sm font-black uppercase text-ink-muted">Bài học</h2><span className="rounded-full bg-cream-soft px-2 py-0.5 text-xs font-black">{courses.length}</span></div><div className="grid gap-1">{courses.map((course) => <button className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 text-left ${selected?._id === course._id ? "bg-coal text-white" : "hover:bg-cream-soft"}`} key={course._id} onClick={() => { setSelectedId(course._id); setActiveLesson("flashcards"); }} type="button"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected?._id === course._id ? "bg-white/12 text-white" : "bg-cream-soft text-coral"}`}><BookOpenText size={17} /></span><span className="min-w-0"><span className="block truncate text-sm font-black">{course.title}</span><span className={`mt-0.5 block text-xs ${selected?._id === course._id ? "text-white/65" : "text-ink-muted"}`}>{course.isPublished ? "Đã xuất bản" : "Bản nháp"}</span></span><ChevronRight size={16} /></button>)}</div>{!courses.length ? <div className="px-4 py-10 text-center text-sm text-ink-muted">Tạo bài học đầu tiên để bắt đầu.</div> : null}</aside>
          {selected ? <main className="min-w-0"><div className="rounded-xl border border-[#e6dfd8] bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-3xl font-semibold">{selected.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-black ${selected.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-cream-soft text-ink-muted"}`}>{selected.isPublished ? "Đã xuất bản" : "Bản nháp"}</span></div><p className="mt-2 text-sm text-ink-muted">{selected.description || "Chưa có tiêu đề phụ."}</p></div><div className="flex gap-1"><Button onClick={toggleCourse} size="icon" title={selected.isPublished ? "Ẩn bài" : "Xuất bản"} type="button" variant="ghost">{selected.isPublished ? <EyeOff size={17} /> : <Eye size={17} />}</Button><Button onClick={() => setCourseDialog({ open: true, course: selected })} size="icon" title="Sửa bài" type="button" variant="ghost"><Edit3 size={17} /></Button><Button className="text-red-600" onClick={removeCourse} size="icon" title="Xoá bài" type="button" variant="ghost"><Trash2 size={17} /></Button></div></div><div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">{lessonTypes.map((lesson, index) => { const Icon = lessonIcons[lesson.id]; return <button className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${activeLesson === lesson.id ? "border-coral bg-[#fff5f0] text-coral" : "border-[#e6dfd8] hover:bg-cream-soft"}`} key={lesson.id} onClick={() => setActiveLesson(lesson.id)} type="button"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activeLesson === lesson.id ? "bg-coral text-white" : "bg-cream-soft text-ink-muted"}`}><Icon size={16} /></span><span><span className="block text-[10px] font-black uppercase opacity-70">Bài {index + 1}</span><span className="mt-0.5 block text-sm font-black leading-tight">{lesson.shortTitle}</span></span></button>; })}</div></div><div className="mt-6">{activeLesson === "flashcards" ? <FlashcardWorkspace course={selected} mutations={mutations} notify={notify} /> : <ExerciseWorkspace course={selected} lessonKey={activeLesson} mutations={mutations} notify={notify} />}</div></main> : <div />}
        </div> : null}
      </div>
      <CourseDialog course={courseDialog.course} mutation={courseDialog.course ? mutations.updateCourse : mutations.createCourse} onClose={() => setCourseDialog({ open: false, course: null })} onCreated={(course) => { if (course?._id) setSelectedId(course._id); notify(courseDialog.course ? "Đã cập nhật bài học." : "Đã tạo bài học với 4 bài mặc định."); }} open={courseDialog.open} />
    </section>
  );
}
