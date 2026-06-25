import { ArrowRight, Edit3, Eye, EyeOff, FolderPlus, Headphones, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Alert } from "../../../components/ui/alert.jsx";
import { cn } from "../../../utils/cn.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useCreateTopic,
  useCreateVideo,
  useDeleteTopic,
  useDeleteVideo,
  usePublishVideo,
  useTopics,
  useUpdateTopic,
  useUpdateVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";

const levels = ["A1", "A2", "B1", "B2", "C1"];
const homeTopicVideoLimit = 4;
const dictationStickerUrl =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3YjhtdDg4Y25ocWtjemR1MnJma3dzODdrYzE2dW9vc2hzMzN0bm02dCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/BOHvk845AYKAVlETl4/giphy.gif";
const shadowingStickerUrl =
  "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3aHJuZzM2eGFxcTRobnVoN2tyNDVpZ2E3cGc0dHpheHVuM3BoY3ljMiZlcD12MV9zdGlja2Vyc19yZWxhdGVkJmN0PXM/ZrDBGncV67i6UUGnj4/giphy.gif";
const bilingualStickerUrl =
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExandpdXN3M2lpMzM2N2w0bDRvcXdsc2djNXF2dmFseWhieWE5eHlsZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/2NYPupxBORY8upRLh9/giphy.gif";
const heroCatUrl =
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTczdTY1a3J1NnY0eTRpaTJjaHE5NGQzbnM1NHpoemxyeDI3NXp0YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/754u3UNlbbc2tMg97K/giphy.gif";
const practiceCatUrl =
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzg0NXpjdW9vajJ1cGx2YmNyajM2Z2gxdnlidjRnNnVzZW13bDhzcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/2A6uZ0XlO5UIy6OiEM/giphy.gif";

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const {
    data: videos = [],
    error: videosError,
    isError: isVideosError,
    isLoading,
    refetch: refetchVideos,
  } = useVideos({ includeUnpublished: isAdmin || undefined });
  const { data: topics = [], isLoading: isTopicsLoading } = useTopics({ includeUnpublished: isAdmin || undefined });
  const createVideoMutation = useCreateVideo();
  const createTopicMutation = useCreateTopic();
  const updateTopicMutation = useUpdateTopic();
  const deleteTopicMutation = useDeleteTopic();
  const updateVideoMutation = useUpdateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topicSections = useMemo(
    () => buildTopicSections({ isAdmin, topics: visibleTopics, videos }),
    [isAdmin, visibleTopics, videos],
  );

  function startLearning(mode) {
    if (!modePickerVideo?._id) return;
    setModePickerVideo(null);
    if (mode === "bilingual") {
      navigate(`/videos/${modePickerVideo._id}/bilingual`);
      return;
    }
    navigate(`/videos/${modePickerVideo._id}?mode=${mode}`);
  }

  return (
    <section className="min-h-full overflow-auto bg-canvas text-coal">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-12 sm:px-6 lg:px-10 lg:pt-20">
        <div className="grid items-end gap-10 border-b border-[#e6dfd8] pb-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-16">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5">Meomeo English cinema club</p>
            <h1 className="display-heading text-[44px] leading-[1.02] sm:text-6xl lg:text-[72px]">
              Bật video lên.<br />Meo meo học liền.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-body sm:text-lg">
              Xem phim, nghe nhạc, luyện nghe chép chính tả và shadowing từ YouTube. Mỗi câu đều có chỗ để nghe kỹ, nhại lại và hiểu sâu hơn.
            </p>
          </div>
          <Card className="overflow-hidden border-0 bg-[#181715] text-canvas">
            <CardContent className="relative min-h-[250px] p-7">
              <Sparkles className="mb-8 text-coral" size={24} />
              <div className="absolute right-4 top-4 flex gap-2">
                <img alt="" aria-hidden="true" className="h-20 w-20 rounded-2xl object-contain" src={heroCatUrl} />
                <img alt="" aria-hidden="true" className="h-20 w-20 rounded-2xl object-contain" src={practiceCatUrl} />
              </div>
              <div className="max-w-[210px] pt-16">
                <p className="font-display text-3xl leading-tight">Một video.<br />Ba kiểu luyện.</p>
                <div className="mt-7 flex flex-wrap gap-2 text-sm text-[#a09d96]">
                  <span>Dictation</span><span>·</span><span>Shadowing</span><span>·</span><span>Song ngữ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Thư viện theo topic</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-tight sm:text-4xl">Chọn chủ đề hôm nay</h2>
          </div>
          {isAdmin ? (
            <div className="flex flex-wrap justify-end gap-2">
              <TopicManagerDialog
                createTopicMutation={createTopicMutation}
                deleteTopicMutation={deleteTopicMutation}
                topics={visibleTopics}
                updateTopicMutation={updateTopicMutation}
              />
              <AddVideoDialog
                createVideoMutation={createVideoMutation}
                onVideoCreated={(video) => navigate(`/videos/${video._id}`)}
                topics={visibleTopics}
              />
            </div>
          ) : null}
        </div>

        {isLoading || isTopicsLoading ? <p className="px-3 text-sm font-bold md:px-0">Đang tải thư viện...</p> : null}

        {isVideosError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="space-y-3 p-6 text-center">
              <p className="font-display text-2xl text-red-900">Không tải được video.</p>
              <p className="mx-auto max-w-xl text-sm text-red-700">
                {videosError?.response?.data?.message ||
                  "Trình duyệt trong Instagram đang chặn hoặc không gọi được API. Bấm thử lại hoặc mở bằng trình duyệt ngoài."}
              </p>
              <Button onClick={() => refetchVideos()} type="button" variant="outline">
                Tải lại
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isVideosError && videos.length === 0 ? (
          <Card className="border-dashed bg-cream-soft">
            <CardContent className="p-8 text-center">
              <p className="font-display text-2xl">Chưa có video nào.</p>
              <p className="mt-2 text-sm text-ink-muted">
                Admin đăng nhập rồi bấm “Thêm video” để tạo bài học đầu tiên.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {topicSections.length > 0 ? (
          <div className="space-y-8">
            {topicSections.map((section) => {
              const sectionVideos = section.videos.slice(0, homeTopicVideoLimit);
              const canExpand = section.topic?.slug && section.videos.length > homeTopicVideoLimit;

              return (
                <TopicVideoSection
                  canExpand={canExpand}
                  deleteVideoMutation={deleteVideoMutation}
                  isAdmin={isAdmin}
                  key={section.key}
                  onSelectVideo={(video) => setModePickerVideo(video)}
                  onViewAll={() => navigate(`/topics/${section.topic.slug}`)}
                  publishVideoMutation={publishVideoMutation}
                  section={section}
                  topics={visibleTopics}
                  updateVideoMutation={updateVideoMutation}
                  videos={sectionVideos}
                />
              );
            })}
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

export function buildTopicSections({ isAdmin, topics, videos }) {
  const sections = topics
    .map((topic) => ({
      key: topic._id,
      title: topic.name,
      description: topic.description,
      topic,
      videos: videos.filter((video) => getTopicId(video) === topic._id),
    }))
    .filter((section) => isAdmin || section.videos.length > 0);
  const knownTopicIds = new Set(topics.map((topic) => topic._id));
  const uncategorizedVideos = videos.filter((video) => !knownTopicIds.has(getTopicId(video)));

  if (uncategorizedVideos.length || isAdmin) {
    sections.push({
      key: "uncategorized",
      title: isAdmin ? "Chưa phân loại" : "Video mới",
      description: isAdmin ? "Video đang nằm ngoài các topic công khai." : "Các video mới nhất trong thư viện.",
      topic: null,
      videos: uncategorizedVideos,
    });
  }

  return sections;
}

export function getTopicId(video) {
  if (!video?.topicId) return "";
  return typeof video.topicId === "string" ? video.topicId : video.topicId._id || "";
}

export function TopicVideoSection({
  canExpand,
  deleteVideoMutation,
  isAdmin,
  onSelectVideo,
  onViewAll,
  publishVideoMutation,
  section,
  topics,
  updateVideoMutation,
  videos,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d8e1ed] bg-canvas px-5 py-3 shadow-[0_2px_0_rgba(20,20,19,0.08)]">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-9 w-1.5 shrink-0 rounded-full bg-[#303866]" />
            <h3 className="truncate text-base font-black tracking-tight text-[#202036] sm:text-xl lg:text-2xl">{section.title}</h3>
            <span className="shrink-0 text-xs font-semibold text-[#46516d] sm:text-sm">({section.videos.length} bài học)</span>
          </div>
          {section.description ? (
            <p className="ml-4 mt-1 line-clamp-1 text-sm text-ink-muted">{section.description}</p>
          ) : null}
        </div>
        {canExpand ? (
          <Button
            className="shrink-0 rounded-2xl border-[#bfc4d3] bg-canvas px-4 font-black uppercase tracking-[0.12em] text-[#303866] shadow-[0_3px_0_rgba(48,56,102,0.16)]"
            onClick={onViewAll}
            type="button"
            variant="outline"
          >
            Xem thêm <ArrowRight size={16} />
          </Button>
        ) : null}
      </div>

      {videos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" data-lesson-grid>
          {videos.map((video, index) => (
            <LessonCard
              deleteVideoMutation={deleteVideoMutation}
              isAdmin={isAdmin}
              key={video._id}
              onSelect={() => onSelectVideo(video)}
              publishVideoMutation={publishVideoMutation}
              topics={topics}
              updateVideoMutation={updateVideoMutation}
              video={video}
              variant={index % 4 === 0 ? "featured" : "default"}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed bg-cream-soft">
          <CardContent className="p-5 text-sm font-semibold text-ink-muted">Topic này chưa có video.</CardContent>
        </Card>
      )}
    </section>
  );
}

export function LessonCard({ deleteVideoMutation, isAdmin, onSelect, publishVideoMutation, topics, updateVideoMutation, video, variant }) {
  const isFeatured = variant === "featured";
  const rawTopicId = getTopicId(video);
  const currentTopicValue = topics.some((topic) => topic._id === rawTopicId) ? rawTopicId : "__none__";

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border-[#d8e1ed] bg-canvas shadow-[0_4px_0_rgba(48,56,102,0.12)] outline-none transition duration-300 hover:-translate-y-1 hover:border-[#c0c8d8] hover:shadow-[0_10px_22px_rgba(48,56,102,0.16)] focus-visible:ring-2 focus-visible:ring-coral/30",
        isFeatured && "border-amber-400 bg-[#fff8e8] shadow-[0_4px_0_rgba(180,116,0,0.35)]",
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
        <Badge className="absolute bottom-3 right-3 gap-1 bg-coal/90 text-white">
          ◷ {formatDuration(video.duration || 0)}
        </Badge>
      </div>

      <CardContent className="space-y-2 p-2.5 sm:space-y-3 sm:p-4">
        <p
          className={cn(
            "line-clamp-2 min-h-[34px] text-xs font-black leading-snug text-[#202036] sm:min-h-[42px] sm:text-sm",
            isFeatured && "text-coral-dark",
          )}
        >
          {video.title}
        </p>

        <div className="hidden grid-cols-1 gap-1 text-xs font-semibold text-[#202036] sm:grid sm:grid-cols-2 sm:gap-3 sm:text-sm">
          <span className="inline-flex items-center gap-1">
            Dictation <span className="text-[#a9b2c4]">ⓧ</span>
          </span>
          <span className="inline-flex items-center gap-1 sm:justify-end">
            Shadowing <span className="text-[#a9b2c4]">ⓧ</span>
          </span>
        </div>

        {isAdmin ? (
          <div className="space-y-2 border-t border-[#e6dfd8] pt-3" onClick={(event) => event.stopPropagation()}>
            <Select
              onValueChange={(value) => {
                updateVideoMutation.mutate({
                  id: video._id,
                  data: { topicId: value === "__none__" ? null : value },
                });
              }}
              value={currentTopicValue}
            >
              <SelectTrigger className="h-9 bg-white text-xs font-semibold">
                <SelectValue placeholder="Chọn topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Chưa phân loại</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic._id} value={topic._id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
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
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export const modeConfig = [
  {
    mode: "dictation",
    title: "Nghe - viết chính tả",
    desc: "Nghe từng câu và gõ lại nội dung chính xác",
    imageAlt: "Nghe viết chính tả",
    imageUrl: dictationStickerUrl,
  },
  {
    mode: "shadowing",
    title: "Bắt chước phát âm",
    desc: "Nghe và ghi âm giọng đọc, chấm điểm bằng AI",
    imageAlt: "Bắt chước phát âm",
    imageUrl: shadowingStickerUrl,
  },
  {
    mode: "bilingual",
    title: "Xem song ngữ",
    desc: "Xem video với phụ đề Anh - Việt đồng bộ",
    imageAlt: "Xem song ngữ",
    imageUrl: bilingualStickerUrl,
  },
];

export function LearningModeDialog({ onOpenChange, onSelectMode, open }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="bottom-0 top-auto max-h-[92vh] w-full max-w-none translate-y-0 gap-5 rounded-b-none rounded-t-2xl p-4 pb-5 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-8">
        <div className="mx-auto h-1.5 w-20 rounded-full bg-cream sm:hidden" />
        <DialogHeader className="px-0 text-left sm:text-center">
          <DialogTitle className="text-2xl">Chọn chế độ</DialogTitle>
          <DialogDescription className="sm:text-base">
            Học sâu từng câu hoặc xem phụ đề song ngữ liền mạch
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {modeConfig.map((item) => (
            <LearningModeCard key={item.mode} {...item} onSelectMode={onSelectMode} />
          ))}
        </div>

        <p className="pt-1 text-center text-xs text-ink-muted">
          Tất cả chế độ đều miễn phí, không cần đăng nhập
        </p>
      </DialogContent>
    </Dialog>
  );
}

function LearningModeCard({ desc, imageAlt, imageUrl, mode, onSelectMode, title }) {
  return (
    <Card className="overflow-hidden bg-cream-soft transition hover:-translate-y-1 hover:border-coral/40">
      <Button
        className="flex h-full w-full min-w-0 flex-col gap-3 whitespace-normal rounded-xl bg-transparent px-4 py-5 text-coal hover:bg-cream sm:px-5 sm:py-7"
        onClick={() => onSelectMode(mode)}
        type="button"
        variant="ghost"
      >
        <img alt={imageAlt} className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" src={imageUrl} />
        <div className="min-w-0 space-y-1 text-center">
          <span className="block text-wrap font-display text-lg font-medium leading-snug">
            {title}
          </span>
          <span className="block text-wrap text-xs leading-relaxed text-ink-muted">
            {desc}
          </span>
        </div>
      </Button>
    </Card>
  );
}

function TopicManagerDialog({ createTopicMutation, deleteTopicMutation, topics, updateTopicMutation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", order: 0, isPublished: true });

  function resetForm() {
    setEditingTopic(null);
    setForm({ name: "", description: "", order: 0, isPublished: true });
  }

  function editTopic(topic) {
    setEditingTopic(topic);
    setForm({
      name: topic.name || "",
      description: topic.description || "",
      order: topic.order || 0,
      isPublished: topic.isPublished ?? true,
    });
  }

  async function submitTopic(event) {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      order: Number(form.order || 0),
      isPublished: form.isPublished,
    };

    if (editingTopic?._id) {
      await updateTopicMutation.mutateAsync({ id: editingTopic._id, data: payload });
    } else {
      await createTopicMutation.mutateAsync(payload);
    }

    resetForm();
  }

  const activeError =
    createTopicMutation.error?.response?.data?.message ||
    updateTopicMutation.error?.response?.data?.message ||
    deleteTopicMutation.error?.response?.data?.message ||
    "";

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
      open={isOpen}
    >
      <DialogTrigger asChild>
        <Button className="rounded-xl" type="button" variant="outline">
          <FolderPlus size={16} /> Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quản lý topic video</DialogTitle>
          <DialogDescription>Tạo topic, sửa thông tin, ẩn/hiện topic và xóa topic chưa có video.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-cream-soft p-4" onSubmit={submitTopic}>
            <p className="text-sm font-black text-coal">{editingTopic ? "Sửa topic" : "Thêm topic mới"}</p>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Tên topic, ví dụ Movie short clip"
              required
              value={form.name}
            />
            <Textarea
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Mô tả ngắn"
              value={form.description}
            />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))}
                placeholder="Thứ tự"
                type="number"
                value={form.order}
              />
              <Button
                aria-label={form.isPublished ? "Topic đang hiển thị" : "Topic đang ẩn"}
                onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
                type="button"
                variant="outline"
              >
                {form.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button disabled={createTopicMutation.isPending || updateTopicMutation.isPending} type="submit">
                {editingTopic ? "Lưu topic" : "Tạo topic"}
              </Button>
              {editingTopic ? (
                <Button onClick={resetForm} type="button" variant="outline">
                  Hủy
                </Button>
              ) : null}
            </div>
            {activeError ? <Alert variant="error">{activeError}</Alert> : null}
          </form>

          <div className="space-y-2">
            {topics.length ? (
              topics.map((topic) => (
                <Card className="bg-canvas" key={topic._id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-coal">{topic.name}</p>
                        <Badge variant={topic.isPublished ? "success" : "secondary"}>
                          {topic.isPublished ? "Public" : "Ẩn"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
                        Thứ tự {topic.order || 0}
                        {topic.description ? ` · ${topic.description}` : ""}
                      </p>
                    </div>
                    <Button onClick={() => editTopic(topic)} size="icon" type="button" variant="outline">
                      <Edit3 size={15} />
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm(`Xóa topic "${topic.name}"? Chỉ xóa được topic chưa có video.`)) {
                          deleteTopicMutation.mutate(topic._id);
                        }
                      }}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed bg-canvas">
                <CardContent className="p-5 text-sm text-ink-muted">Chưa có topic nào.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddVideoDialog({ createVideoMutation, onVideoCreated, topics }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptError, setTranscriptError] = useState("");
  const [videoForm, setVideoForm] = useState({
    topicId: "__none__",
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: true,
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
      topicId: videoForm.topicId === "__none__" ? undefined : videoForm.topicId,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
      transcripts: manualTranscripts.segments.length ? manualTranscripts.segments : undefined,
    });
    const video = response.data.data.video;
    setVideoForm({ topicId: "__none__", youtubeUrl: "", title: "", description: "", level: "A2", isPublished: true });
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
          <Select
            onValueChange={(value) => setVideoForm((current) => ({ ...current, topicId: value }))}
            value={videoForm.topicId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Chưa phân loại</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic._id} value={topic._id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
