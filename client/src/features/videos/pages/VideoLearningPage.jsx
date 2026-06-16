import { Eye, EyeOff, Merge, Pencil, RefreshCw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import {
  useAnalyzeVideoTranscript,
  useCheckDictation,
  useMergeTranscriptSegment,
  useUpdateTranscriptSegment,
  useVideo,
  useVideoTranscripts,
} from "../hooks/useVideoLearning.js";

const difficulties = ["easy", "normal", "hard"];

export default function VideoLearningPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "shadowing" ? "shadowing" : "dictation";
  const [mode, setMode] = useState(initialMode);
  const [difficulty, setDifficulty] = useState("normal");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answer, setAnswer] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState("");
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: video, isLoading: isVideoLoading } = useVideo(id);
  const { data: segments = [], isLoading: isSegmentsLoading } = useVideoTranscripts(id);
  const checkMutation = useCheckDictation();
  const analyzeMutation = useAnalyzeVideoTranscript(id);
  const updateSegmentMutation = useUpdateTranscriptSegment(id);
  const mergeSegmentMutation = useMergeTranscriptSegment(id);
  const segment = segments[currentIndex];
  const embedUrl = useMemo(() => {
    if (!video?.youtubeVideoId) return "";
    const start = Math.floor(segment?.startTime || 0);
    return `https://www.youtube.com/embed/${video.youtubeVideoId}?start=${start}&rel=0`;
  }, [segment?.startTime, video?.youtubeVideoId]);

  function move(delta) {
    setCurrentIndex((current) => {
      const next = Math.min(Math.max(current + delta, 0), Math.max(segments.length - 1, 0));
      return next;
    });
    setAnswer("");
    checkMutation.reset();
  }

  async function submitDictation(event) {
    event.preventDefault();
    if (!segment) return;
    await checkMutation.mutateAsync({
      sessionId: getGuestSessionId(),
      segmentId: segment._id,
      difficulty,
      userAnswer: answer,
    });
  }

  if (isVideoLoading || isSegmentsLoading) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold">Đang tải bài học...</section>;
  }

  if (!video) {
    return <section className="h-full overflow-auto bg-matcha p-6 font-bold text-red-600">Không tìm thấy video.</section>;
  }

  return (
    <section className="h-full overflow-auto bg-matcha p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-coal/55">YouTube - {video.level}</p>
              {isAdmin ? (
                <button
                  className={inactiveButtonClass}
                  disabled={analyzeMutation.isPending}
                  onClick={() => analyzeMutation.mutate()}
                  type="button"
                >
                  <RefreshCw className={analyzeMutation.isPending ? "animate-spin" : ""} size={16} />
                  {analyzeMutation.isPending ? "Đang phân tích..." : "Phân tích transcript"}
                </button>
              ) : null}
            </div>
            <h1 className="text-2xl font-black leading-tight md:text-3xl">{video.title}</h1>
            {video.transcriptStatus === "failed" && video.transcriptError ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {video.transcriptError}
              </p>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-xl border border-coal/15 bg-black shadow-sm">
            {embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
                src={embedUrl}
                title={video.title}
              />
            ) : null}
          </div>
          <div className="rounded-xl bg-white/75 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                className={mode === "dictation" ? activeButtonClass : inactiveButtonClass}
                onClick={() => setMode("dictation")}
                type="button"
              >
                Dictation
              </button>
              <button
                className={mode === "shadowing" ? activeButtonClass : inactiveButtonClass}
                onClick={() => setMode("shadowing")}
                type="button"
              >
                Shadowing
              </button>
              <button className={inactiveButtonClass} onClick={() => setShowTranscript((value) => !value)} type="button">
                {showTranscript ? <EyeOff size={16} /> : <Eye size={16} />} {showTranscript ? "Ẩn transcript" : "Hiện transcript"}
              </button>
            </div>
            {segment ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-coal/55">
                  Segment {currentIndex + 1}/{segments.length} - {segment.startTime}s đến {segment.endTime}s
                </p>
                {showTranscript ? <p className="rounded-lg bg-matcha/70 p-3 text-lg font-black">{segment.text}</p> : <DictationPrompt difficulty={difficulty} text={segment.text} />}
                <div className="flex gap-2">
                  <button className={inactiveButtonClass} disabled={currentIndex === 0} onClick={() => move(-1)} type="button">
                    Previous
                  </button>
                  <button className={inactiveButtonClass} disabled={currentIndex >= segments.length - 1} onClick={() => move(1)} type="button">
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-bold">Video này chưa có transcript segment.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/75 p-4">
          {mode === "dictation" ? (
            <form className="space-y-3" onSubmit={submitDictation}>
              <h2 className="text-xl font-black">Dictation</h2>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((item) => (
                  <button
                    className={difficulty === item ? activeButtonClass : inactiveButtonClass}
                    key={item}
                    onClick={() => setDifficulty(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <TranscriptScroller
                currentIndex={currentIndex}
                difficulty={difficulty}
                editingSegmentId={editingSegmentId}
                isAdmin={isAdmin}
                mergeSegmentMutation={mergeSegmentMutation}
                onEdit={setEditingSegmentId}
                onSelect={(index) => {
                  setCurrentIndex(index);
                  setAnswer("");
                  checkMutation.reset();
                }}
                onUpdate={async (item, data) => {
                  await updateSegmentMutation.mutateAsync({ segmentId: item._id, data });
                  setEditingSegmentId("");
                }}
                segments={segments}
                setEditingSegmentId={setEditingSegmentId}
              />
              <textarea
                className="min-h-36 w-full rounded-lg border border-coal/15 bg-white p-3 text-sm font-semibold outline-none focus:border-coal"
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Gõ câu trả lời của bạn ở đây..."
                value={answer}
              />
              <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white" disabled={!segment || checkMutation.isPending}>
                {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
              </button>
              {checkMutation.data?.data?.data ? <DictationResult result={checkMutation.data.data.data} /> : null}
            </form>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-black">Shadowing</h2>
              <p className="text-sm font-semibold text-coal/65">
                Nghe segment hiện tại, đọc lại theo transcript rồi gửi audio để Azure Speech chấm điểm. Phần ghi âm browser sẽ triển khai ở bước kế tiếp.
              </p>
              <button className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white" type="button">
                Record
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TranscriptScroller({
  currentIndex,
  difficulty,
  editingSegmentId,
  isAdmin,
  mergeSegmentMutation,
  onEdit,
  onSelect,
  onUpdate,
  segments,
  setEditingSegmentId,
}) {
  if (!segments.length) {
    return (
      <div className="rounded-xl border border-dashed border-coal/20 bg-white/75 p-4 text-sm font-bold text-coal/65">
        Chưa có transcript. Admin bấm “Phân tích transcript” để lấy subtitle từ YouTube.
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-transcript-scroller>
      <div className="flex min-w-full snap-x snap-mandatory gap-3" data-transcript-track>
        {segments.map((item, index) => (
          <div
            className={[
              "min-h-32 w-[78%] shrink-0 snap-start rounded-xl border p-3 text-sm shadow-sm sm:w-[48%] lg:w-[42%]",
              index === currentIndex ? "border-coal bg-[#eef2ff]" : "border-coal/10 bg-white/80",
            ].join(" ")}
            data-transcript-card
            key={item._id}
          >
            <button className="block w-full text-left font-black" onClick={() => onSelect(index)} type="button">
              #{item.index}
            </button>
            {editingSegmentId === item._id ? (
              <TranscriptEditForm
                item={item}
                onCancel={() => setEditingSegmentId("")}
                onSave={(data) => onUpdate(item, data)}
              />
            ) : (
              <DictationPrompt difficulty={difficulty} text={item.text} />
            )}
            {isAdmin ? (
              <div className="mt-3 flex justify-end gap-2">
                <button className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold" onClick={() => onEdit(item._id)} type="button">
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold"
                  disabled={mergeSegmentMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn ghép segment này với segment tiếp theo không?")) {
                      mergeSegmentMutation.mutate(item._id);
                    }
                  }}
                  type="button"
                >
                  <Merge size={13} /> Merge
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DictationPrompt({ difficulty, text }) {
  const words = text.split(/\s+/).filter(Boolean);

  if (difficulty === "hard") {
    return <p className="rounded-lg bg-matcha/70 p-3 text-lg font-black">Gõ toàn bộ câu nghe được.</p>;
  }

  const masked = words.map((word, index) => {
    if (difficulty === "easy") return index % 4 === 1 ? "____" : word;
    return index % 2 === 0 ? "____" : word.replace(/[A-Za-zÀ-ỹ]/g, "_");
  });

  return <p className="rounded-lg bg-matcha/70 p-3 text-lg font-black">{masked.join(" ")}</p>;
}

function DictationResult({ result }) {
  return (
    <div className="rounded-lg bg-matcha/70 p-3 text-sm font-bold">
      <p>Score: {result.score}</p>
      <p>{result.isCorrect ? "Đúng rồi." : "Chưa đúng."}</p>
      <p>Correct: {result.correctText}</p>
      {result.mistakes?.length ? <p>Mistakes: {result.mistakes.length}</p> : null}
    </div>
  );
}

function TranscriptEditForm({ item, onCancel, onSave }) {
  const [form, setForm] = useState({
    text: item.text,
    startTime: item.startTime,
    endTime: item.endTime,
    isPublished: item.isPublished,
  });

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(form);
      }}
    >
      <textarea
        className="min-h-20 w-full rounded-md border border-coal/15 p-2 text-sm outline-none"
        onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
        value={form.text}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, startTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.startTime}
        />
        <input
          className="h-9 rounded-md border border-coal/15 px-2 text-sm outline-none"
          onChange={(event) => setForm((current) => ({ ...current, endTime: Number(event.target.value) }))}
          step="0.1"
          type="number"
          value={form.endTime}
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          checked={form.isPublished}
          onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
          type="checkbox"
        />
        Published
      </label>
      <div className="flex gap-2">
        <button className="rounded-md bg-black px-2 py-1 text-xs font-bold text-white" type="submit">
          <Save size={13} /> Save
        </button>
        <button className="rounded-md border border-coal/15 px-2 py-1 text-xs font-bold" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  );
}

const activeButtonClass = "inline-flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-sm font-bold text-white disabled:opacity-50";
const inactiveButtonClass = "inline-flex items-center gap-1 rounded-lg border border-coal/20 bg-white/70 px-3 py-2 text-sm font-bold disabled:opacity-50";
