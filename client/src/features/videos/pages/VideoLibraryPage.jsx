import { ArrowDown, ArrowRight, Headphones, Mic, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { cn } from "../../../utils/cn.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useCreateVideo,
  useDeleteVideo,
  usePublishVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";

const levels = ["A1", "A2", "B1", "B2", "C1"];
const pageSize = 8;
const dictationStickerUrl =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YjhtdDg4Y25ocWtjemR1MnJma3dzODdrYzE2dW9vc2hzMzN0bm02dCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/BOHvk845AYKAVlETl4/giphy.gif";
const shadowingStickerUrl =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aHJuZzM2eGFxcTRobnVoN2tyNDVpZ2E3cGc0dHpheHVuM3BoY3ljMiZlcD12MV9zdGlja2Vyc19yZWxhdGVkJmN0PXM/ZrDBGncV67i6UUGnj4/giphy.gif";

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const { data: videos = [], isLoading } = useVideos({ includeUnpublished: isAdmin || undefined });
  const createVideoMutation = useCreateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const visibleVideos = videos.slice(0, visibleCount);
  const hasMoreVideos = visibleCount < videos.length;

  function startLearning(mode) {
    if (!modePickerVideo?._id) return;
    setModePickerVideo(null);
    navigate(`/videos/${modePickerVideo._id}?mode=${mode}`);
  }

  return (
    <section className="min-h-full overflow-auto bg-canvas text-coal">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-12 sm:px-6 lg:px-10 lg:pt-20">
        <div className="grid items-end gap-10 border-b border-[#e6dfd8] pb-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5">YouTube shadowing & dictation</p>
            <h1 className="display-heading text-[44px] leading-[1.02] sm:text-6xl lg:text-[72px]">
              Nghe rõ hơn.<br />Nói tự nhiên hơn.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-body sm:text-lg">
              Luyện tiếng Anh từ những video bạn yêu thích, từng câu một — nghe, viết và bắt chước nhịp nói thật.
            </p>
          </div>
          <Card className="overflow-hidden border-0 bg-[#181715] text-canvas">
            <CardContent className="p-7">
              <Sparkles className="mb-12 text-coral" size={24} />
              <p className="font-display text-3xl leading-tight">Một video.<br />Hai cách luyện.</p>
              <div className="mt-7 flex gap-2 text-sm text-[#a09d96]">
                <span>Dictation</span><span>·</span><span>Shadowing</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Thư viện</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight sm:text-4xl">Chọn bài học hôm nay</h2>
          </div>
          {isAdmin ? (
            <AddVideoDialog
              createVideoMutation={createVideoMutation}
              onVideoCreated={(video) => navigate(`/videos/${video._id}`)}
            />
          ) : null}
        </div>

        {isLoading ? <p className="px-3 text-sm font-bold md:px-0">Đang tải video...</p> : null}

        {!isLoading && videos.length === 0 ? (
          <Card className="border-dashed bg-cream-soft">
            <CardContent className="p-8 text-center">
              <p className="font-display text-2xl">Chưa có video nào.</p>
              <p className="mt-2 text-sm text-ink-muted">
                Admin đăng nhập rồi bấm “Thêm video” để tạo bài học đầu tiên.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-lesson-grid>
            {visibleVideos.map((video, index) => (
              <LessonCard
                deleteVideoMutation={deleteVideoMutation}
                isAdmin={isAdmin}
                key={video._id}
                onSelect={() => setModePickerVideo(video)}
                publishVideoMutation={publishVideoMutation}
                video={video}
                variant={index % 3 === 0 ? "featured" : "default"}
              />
            ))}
          </div>
        ) : null}

        {hasMoreVideos ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              className="min-w-40"
              onClick={() => setVisibleCount((count) => Math.min(count + pageSize, videos.length))}
              type="button"
              variant="outline"
            >
              Xem thêm <ArrowDown size={16} />
            </Button>
            <p className="text-xs text-ink-muted">
              Đang hiển thị {visibleVideos.length} / {videos.length} video
            </p>
          </div>
        ) : null}

        <LearningModeDialog
          onOpenChange={(isOpen) => {
            if (!isOpen) setModePickerVideo(null);
          }}
          onSelectMode={startLearning}
          open={Boolean(modePickerVideo)}
        />
      </div>
    </section>
  );
}

function LessonCard({ deleteVideoMutation, isAdmin, onSelect, publishVideoMutation, video, variant }) {
  const isFeatured = variant === "featured";

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden border-[#e6dfd8] bg-canvas outline-none transition duration-300 hover:-translate-y-1 hover:border-[#cfc5b8] hover:shadow-[0_16px_38px_rgba(20,20,19,0.08)] focus-visible:ring-2 focus-visible:ring-coral/30",
        isFeatured && "bg-cream",
      )}
      data-lesson-card
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-video overflow-hidden bg-cream-strong">
        <img
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          src={video.thumbnailUrl}
        />
        <Badge className="absolute left-3 top-3 gap-1 bg-coal/90 text-white">
          <Headphones size={12} /> {formatNumber(video.viewCount || 0)}
        </Badge>
        <Badge className="absolute right-3 top-3 bg-coral text-white">
          {video.level || "A2"}
        </Badge>
        <Badge className="absolute bottom-3 right-3 gap-1 bg-coal/90 text-white">
          ◷ {formatDuration(video.duration || 0)}
        </Badge>
      </div>

      <CardContent className="space-y-4 p-5">
        <p
          className={cn(
            "line-clamp-2 min-h-[48px] font-display text-xl font-normal leading-snug text-coal",
          )}
        >
          {video.title}
        </p>

        <div className="flex items-center justify-between border-t border-[#e6dfd8] pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Bắt đầu học</span>
          <ArrowRight className="text-coral transition group-hover:translate-x-1" size={18} />
        </div>

        {isAdmin ? (
          <div className="flex gap-2 border-t border-[#e6dfd8] pt-3" onClick={(event) => event.stopPropagation()}>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                publishVideoMutation.mutate({ id: video._id, isPublished: !video.isPublished });
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              {video.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                if (window.confirm("Xóa video này?")) deleteVideoMutation.mutate(video._id);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LearningModeDialog({ onOpenChange, onSelectMode, open }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="bottom-0 top-auto max-h-[92vh] w-full max-w-none translate-y-0 gap-5 rounded-b-none rounded-t-2xl p-4 pb-5 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-7">
        <div className="mx-auto h-1.5 w-20 rounded-full bg-cream sm:hidden" />
        <DialogHeader className="px-0 text-left sm:text-center">
          <DialogTitle>Chọn chế độ học</DialogTitle>
          <DialogDescription className="sm:text-base">
            Chọn chế độ học phù hợp với bạn nhất
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <LearningModeCard
            imageAlt="Nghe viết chính tả"
            imageUrl={dictationStickerUrl}
            mode="dictation"
            onSelectMode={onSelectMode}
            title="Nghe - viết chính tả"
          />
          <LearningModeCard
            Icon={Mic}
            imageAlt="Bắt chước phát âm"
            imageUrl={shadowingStickerUrl}
            mode="shadowing"
            onSelectMode={onSelectMode}
            title="Bắt chước phát âm"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LearningModeCard({ Icon = Pencil, imageAlt, imageUrl, mode, onSelectMode, title }) {
  return (
    <Card
      className="min-h-[168px] overflow-hidden bg-cream-soft transition hover:-translate-y-1 hover:border-coral/40 sm:min-h-[224px]"
    >
      <Button
        className="flex h-full min-h-[168px] w-full flex-col gap-4 rounded-xl bg-transparent px-4 py-6 text-coal hover:bg-cream sm:min-h-[224px] sm:gap-5 sm:px-5"
        onClick={() => onSelectMode(mode)}
        type="button"
        variant="ghost"
      >
        <img alt={imageAlt} className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" src={imageUrl} />
        <span className="flex whitespace-normal items-center justify-center gap-2 text-center font-display text-xl font-normal leading-snug">
          <Icon className="h-4 w-4 shrink-0" />
          {title}
        </span>
      </Button>
    </Card>
  );
}

function AddVideoDialog({ createVideoMutation, onVideoCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptError, setTranscriptError] = useState("");
  const [videoForm, setVideoForm] = useState({
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: false,
  });

  async function handleCreateVideo(event) {
    event.preventDefault();
    setTranscriptError("");

    const manualTranscripts = parseManualTranscript(transcriptText);

    if (manualTranscripts.error) {
      setTranscriptError(manualTranscripts.error);
      return;
    }

    const response = await createVideoMutation.mutateAsync({
      ...videoForm,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
      transcripts: manualTranscripts.segments.length ? manualTranscripts.segments : undefined,
    });
    const video = response.data.data.video;
    setVideoForm({ youtubeUrl: "", title: "", description: "", level: "A2", isPublished: false });
    setTranscriptText("");
    setIsOpen(false);
    onVideoCreated(video);
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus size={16} /> Thêm video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm video YouTube</DialogTitle>
          <DialogDescription>
            Có thể để trống transcript để hệ thống tự lấy, hoặc dán transcript thủ công theo từng dòng.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={handleCreateVideo}>
          <Input
            onChange={(event) => setVideoForm((current) => ({ ...current, youtubeUrl: event.target.value }))}
            placeholder="YouTube URL"
            required
            value={videoForm.youtubeUrl}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <Input
              onChange={(event) => setVideoForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title tùy chỉnh"
              value={videoForm.title}
            />
            <Select
              onValueChange={(value) => setVideoForm((current) => ({ ...current, level: value }))}
              value={videoForm.level}
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            onChange={(event) => setVideoForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Mô tả ngắn"
            value={videoForm.description}
          />
          <div className="space-y-2 rounded-2xl border border-[#d8e1ed] bg-canvas p-3">
            <div>
              <p className="text-sm font-black text-coal">Transcript thủ công</p>
              <p className="mt-1 text-xs font-semibold text-ink-muted">
                Mỗi dòng gồm thời gian bắt đầu, thời gian kết thúc và nội dung. Ví dụ:
                <br />
                <span className="font-mono">00:01 - 00:04 Hello everyone</span>
                <br />
                <span className="font-mono">4.5 | 7.2 | This is a sentence</span>
              </p>
            </div>
            <Textarea
              className="min-h-40 bg-white font-mono text-sm"
              onChange={(event) => {
                setTranscriptText(event.target.value);
                setTranscriptError("");
              }}
              placeholder={`00:01 - 00:04 Hello everyone\n00:04 - 00:07 Welcome back to class`}
              value={transcriptText}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-ink-muted">
              <span>{parseManualTranscript(transcriptText).segments.length || 0} segment thủ công</span>
              <Button
                onClick={() => {
                  setTranscriptText("");
                  setTranscriptError("");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Xóa transcript
              </Button>
            </div>
            {transcriptError ? <p className="text-sm font-bold text-red-600">{transcriptError}</p> : null}
          </div>
          {createVideoMutation.error ? (
            <p className="text-sm font-bold text-red-600">
              {createVideoMutation.error.response?.data?.message || "Không thêm được video."}
            </p>
          ) : null}
          <Button disabled={createVideoMutation.isPending} type="submit">
            {createVideoMutation.isPending ? "Đang phân tích transcript..." : "Thêm video"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parseTimeToSeconds(value) {
  const raw = String(value || "").trim().replace(",", ".");
  if (!raw) return Number.NaN;

  if (!raw.includes(":")) return Number(raw);

  const parts = raw.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return Number.NaN;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return Number.NaN;
}

function parseManualTranscript(value) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { segments: [], error: "" };

  const segments = [];

  for (const [lineIndex, line] of lines.entries()) {
    const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
    const dashMatch = line.match(/^(\S+)\s*(?:-->|-|–|—)\s*(\S+)\s+(.+)$/);
    const match = pipeMatch || dashMatch;

    if (!match) {
      return {
        segments: [],
        error: `Dòng ${lineIndex + 1} chưa đúng định dạng. Dùng "00:01 - 00:04 Nội dung" hoặc "1 | 4 | Nội dung".`,
      };
    }

    const startTime = parseTimeToSeconds(match[1]);
    const endTime = parseTimeToSeconds(match[2]);
    const text = match[3].trim();

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return { segments: [], error: `Dòng ${lineIndex + 1} có thời gian không hợp lệ.` };
    }

    if (endTime <= startTime) {
      return { segments: [], error: `Dòng ${lineIndex + 1} cần thời gian kết thúc lớn hơn thời gian bắt đầu.` };
    }

    if (!text) {
      return { segments: [], error: `Dòng ${lineIndex + 1} chưa có nội dung transcript.` };
    }

    segments.push({ startTime, endTime, text });
  }

  return { segments, error: "" };
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = Math.floor(total % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
