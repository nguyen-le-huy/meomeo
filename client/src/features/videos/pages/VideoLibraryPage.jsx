import { ChevronLeft, ChevronRight, Headphones, Mic, Pencil, Plus, Trash2 } from "lucide-react";
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
  const [page, setPage] = useState(1);
  const { data: videos = [], isLoading } = useVideos({ includeUnpublished: isAdmin || undefined });
  const createVideoMutation = useCreateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const totalPages = Math.max(1, Math.ceil(videos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedVideos = videos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function startLearning(mode) {
    if (!modePickerVideo?._id) return;
    setModePickerVideo(null);
    navigate(`/videos/${modePickerVideo._id}?mode=${mode}`);
  }

  return (
    <section className="h-full overflow-auto bg-[#f7f9fb] px-0 py-3 text-[#202235] md:px-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="flex items-center justify-between px-3 md:px-0">
          <div>
            <h1 className="text-xl font-black md:text-3xl">Video Dictation</h1>
            <p className="mt-1 text-sm font-bold text-[#62697b]">Chọn video để luyện nghe chép chính tả.</p>
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
          <Card className="mx-3 border-dashed border-[#cfd8e6] bg-white md:mx-0">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-black">Chưa có video nào.</p>
              <p className="mt-2 text-sm font-semibold text-[#62697b]">
                Admin đăng nhập rồi bấm “Thêm video” để tạo bài học đầu tiên.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {videos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-0 md:grid-cols-3 md:gap-5 xl:grid-cols-4" data-lesson-grid>
            {pagedVideos.map((video, index) => (
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

        {videos.length > pageSize ? (
          <div className="flex items-center justify-center gap-2 px-3 pb-5 md:px-0">
            <Button
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="rounded-full border border-[#cfd8e6] bg-white px-4 py-2 text-xs font-black text-[#25294f] shadow-sm">
              {currentPage} / {totalPages}
            </div>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              size="sm"
              type="button"
              variant="outline"
            >
              <ChevronRight size={16} />
            </Button>
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
        "group cursor-pointer overflow-hidden rounded-[16px] border-[#d8e1ed] bg-white shadow-[0_4px_0_#cbd5e1] outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-coal/25",
        isFeatured && "border-2 border-[#f5bc00] bg-[#fff8e8] shadow-[0_4px_0_#9b7200]",
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
      <div className="relative aspect-[16/8.2] overflow-hidden bg-[#d9e2ec]">
        <img
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          src={video.thumbnailUrl}
        />
        <Badge className="absolute left-2 top-2 gap-1 rounded-md bg-[#272852]/95 text-white">
          <Headphones size={12} /> {formatNumber(video.viewCount || 0)}
        </Badge>
        <Badge className="absolute right-2 top-2 rounded-md bg-[#d7f8df] text-[#0e5f33] md:text-lg">
          {video.level || "A2"}
        </Badge>
        <Badge className="absolute bottom-2 left-2 gap-1 rounded-md bg-red-50 text-red-700" variant="youtube">
          <span className="text-[10px]">▶</span> Youtube
        </Badge>
        <Badge className="absolute bottom-2 right-2 gap-1 rounded-md bg-[#272852]/95 text-white">
          ◷ {formatDuration(video.duration || 0)}
        </Badge>
      </div>

      <CardContent className="space-y-3 p-3 md:p-4">
        <p
          className={cn(
            "line-clamp-2 min-h-[36px] text-[13px] font-black leading-snug text-[#202235] md:text-base",
            isFeatured && "text-[#eb7100]",
          )}
        >
          {video.title}
        </p>

        {isAdmin ? (
          <div className="flex gap-2 border-t border-[#d8e1ed] pt-3" onClick={(event) => event.stopPropagation()}>
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
      <DialogContent className="bottom-0 top-auto max-h-[92vh] w-full max-w-none translate-y-0 gap-5 rounded-b-none rounded-t-[24px] border-[#d8e1ed] p-3 pb-4 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6">
        <div className="mx-auto h-1.5 w-20 rounded-full bg-[#e8edf5] sm:hidden" />
        <DialogHeader className="px-0 text-left sm:text-center">
          <DialogTitle className="text-lg font-black text-[#202235] sm:text-2xl">Chọn chế độ học</DialogTitle>
          <DialogDescription className="text-sm font-semibold text-[#647084] sm:text-base">
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
      className="min-h-[168px] overflow-hidden rounded-2xl border-[#dbe4ee] bg-white shadow-[0_4px_0_#d5e0eb] transition hover:-translate-y-0.5 hover:border-[#bac8d8] hover:shadow-[0_5px_0_#c5d2df] sm:min-h-[224px]"
    >
      <Button
        className="flex h-full min-h-[168px] w-full flex-col gap-4 rounded-2xl bg-transparent px-4 py-6 text-[#202235] hover:bg-[#f8fafc] sm:min-h-[224px] sm:gap-5 sm:px-5"
        onClick={() => onSelectMode(mode)}
        type="button"
        variant="ghost"
      >
        <img alt={imageAlt} className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" src={imageUrl} />
        <span className="flex whitespace-normal items-center justify-center gap-2 text-center text-sm font-black uppercase leading-snug tracking-normal sm:text-base">
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
          <div className="space-y-2 rounded-2xl border border-[#d8e1ed] bg-[#f7f9fb] p-3">
            <div>
              <p className="text-sm font-black text-[#202235]">Transcript thủ công</p>
              <p className="mt-1 text-xs font-semibold text-[#62697b]">
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
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#62697b]">
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
