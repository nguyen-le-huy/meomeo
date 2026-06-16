import { ChevronLeft, ChevronRight, Crown, Headphones, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  useCreateTopic,
  useCreateVideo,
  useDeleteVideo,
  usePublishVideo,
  useTopics,
  useVideos,
} from "../hooks/useVideoLearning.js";

const levels = ["A1", "A2", "B1", "B2", "C1"];
const pageSize = 8;

const demoVideos = [
  {
    _id: "demo-mononoke",
    title: "PRINCESS MONONOKE | Official English Trailer",
    thumbnailUrl: "https://img.youtube.com/vi/4OiMOHRDs14/hqdefault.jpg",
    level: "A2",
    duration: 64,
    viewCount: 33889,
    isPublished: true,
    isPro: true,
    topicId: { name: "Movie short clip" },
  },
  {
    _id: "demo-kiki",
    title: "KIKI'S DELIVERY SERVICE | Official English Trailer",
    thumbnailUrl: "https://img.youtube.com/vi/4bG17OYs-GA/hqdefault.jpg",
    level: "B1",
    duration: 50,
    viewCount: 48737,
    isPublished: true,
    topicId: { name: "Movie short clip" },
  },
  {
    _id: "demo-toy-story",
    title: "Toy Story Tribute",
    thumbnailUrl: "https://img.youtube.com/vi/wmiIUN-7qhE/hqdefault.jpg",
    level: "B2",
    duration: 113,
    viewCount: 20911,
    isPublished: true,
    topicId: { name: "Movie short clip" },
  },
  {
    _id: "demo-stranger-things",
    title: "Stranger Things 5 | Official Trailer | Netflix",
    thumbnailUrl: "https://img.youtube.com/vi/b9EkMc79ZSU/hqdefault.jpg",
    level: "B1",
    duration: 175,
    viewCount: 15252,
    isPublished: true,
    topicId: { name: "Movie short clip" },
  },
  {
    _id: "demo-love-mom",
    title: "Love mom",
    thumbnailUrl: "https://img.youtube.com/vi/5MgBikgcWnY/hqdefault.jpg",
    level: "A2",
    duration: 144,
    viewCount: 74622,
    isPublished: true,
    topicId: { name: "Daily English Conversation" },
  },
  {
    _id: "demo-valentine",
    title: "Valentine's Day Story | Culture and History | Stories for Kids",
    thumbnailUrl: "https://img.youtube.com/vi/Rp4W6D7L9CQ/hqdefault.jpg",
    level: "A2",
    duration: 179,
    viewCount: 19957,
    isPublished: true,
    topicId: { name: "Daily English Conversation" },
  },
  {
    _id: "demo-dolphin",
    title: "A Dolphin Show Debate",
    thumbnailUrl: "https://img.youtube.com/vi/CuQ-Ha9vJgA/hqdefault.jpg",
    level: "B1",
    duration: 72,
    viewCount: 17686,
    isPublished: true,
    isPro: true,
    topicId: { name: "Daily English Conversation" },
  },
  {
    _id: "demo-sweet",
    title: "A Sweet Welcome",
    thumbnailUrl: "https://img.youtube.com/vi/rD6FRDd9Hew/hqdefault.jpg",
    level: "A1",
    duration: 34,
    viewCount: 60658,
    isPublished: true,
    topicId: { name: "Daily English Conversation" },
  },
  {
    _id: "demo-ielts-1",
    title: "IELTS Listening Practice - Short Conversation",
    thumbnailUrl: "https://img.youtube.com/vi/8S0FDjFBj8o/hqdefault.jpg",
    level: "B1",
    duration: 96,
    viewCount: 22842,
    isPublished: true,
    topicId: { name: "IELTS Listening" },
  },
  {
    _id: "demo-ielts-2",
    title: "IELTS Listening Daily Topic",
    thumbnailUrl: "https://img.youtube.com/vi/2ePf9rue1Ao/hqdefault.jpg",
    level: "B2",
    duration: 130,
    viewCount: 18509,
    isPublished: true,
    topicId: { name: "IELTS Listening" },
  },
];

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [page, setPage] = useState(1);
  const { data: topics = [] } = useTopics({ includeUnpublished: isAdmin || undefined });
  const { data: videos = [], isLoading } = useVideos({ includeUnpublished: isAdmin || undefined });
  const createTopicMutation = useCreateTopic();
  const createVideoMutation = useCreateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const lessons = videos.length ? videos : demoVideos;
  const totalPages = Math.max(1, Math.ceil(lessons.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLessons = lessons.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const sections = groupByTopic(pagedLessons);

  return (
    <section className="h-full overflow-auto bg-[#f7f9fb] px-0 py-3 text-[#202235] md:px-6">
      <div className="mx-auto max-w-[1500px] space-y-8">
        {isAdmin ? (
          <AddVideoDialog
            createTopicMutation={createTopicMutation}
            createVideoMutation={createVideoMutation}
            onVideoCreated={(video) => navigate(`/videos/${video._id}`)}
            topics={topics}
          />
        ) : null}

        {isLoading ? <p className="px-3 text-sm font-bold md:px-0">Đang tải video...</p> : null}

        {sections.map((section) => (
          <LessonSection
            deleteVideoMutation={deleteVideoMutation}
            isAdmin={isAdmin}
            key={section.name}
            publishVideoMutation={publishVideoMutation}
            section={section}
            usingDemo={!videos.length}
          />
        ))}

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
      </div>
    </section>
  );
}

function LessonSection({ deleteVideoMutation, isAdmin, publishVideoMutation, section, usingDemo }) {
  return (
    <section className="space-y-4">
      <div className="mx-0 flex min-h-[58px] items-center justify-between border-y border-[#d8e0ec] bg-white px-3 shadow-[0_2px_0_#c6d0de] md:mx-0 md:rounded-2xl md:border">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-8 w-1.5 shrink-0 rounded-full bg-[#25275a]" />
          <h2 className="truncate text-lg font-black leading-none md:text-2xl">{section.name}</h2>
          <span className="shrink-0 text-xs font-bold text-[#3d435c] md:text-sm">({section.total} bài học)</span>
        </div>
        <Button className="h-9 rounded-xl border-[#bfc6d5] px-3 text-xs font-black md:px-5" size="sm" variant="outline">
          XEM TẤT CẢ <ChevronRight size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-0 md:grid-cols-3 md:gap-5 md:px-0 xl:grid-cols-4" data-lesson-grid>
        {section.items.map((video, index) => (
          <LessonCard
            deleteVideoMutation={deleteVideoMutation}
            isAdmin={isAdmin}
            key={video._id}
            publishVideoMutation={publishVideoMutation}
            usingDemo={usingDemo}
            video={video}
            variant={index % 3 === 0 ? "featured" : "default"}
          />
        ))}
      </div>
    </section>
  );
}

function LessonCard({ deleteVideoMutation, isAdmin, publishVideoMutation, usingDemo, video, variant }) {
  const isFeatured = variant === "featured" || video.isPro;
  const detailPath = usingDemo ? "/" : `/videos/${video._id}`;

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-[16px] border-[#d8e1ed] bg-white shadow-[0_4px_0_#cbd5e1]",
        isFeatured && "border-2 border-[#f5bc00] bg-[#fff8e8] shadow-[0_4px_0_#9b7200]",
      )}
      data-lesson-card
    >
      <Link aria-disabled={usingDemo} className="block" onClick={(event) => usingDemo && event.preventDefault()} to={detailPath}>
        <div className="relative aspect-[16/8.2] overflow-hidden bg-[#d9e2ec]">
          <img
            alt={video.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            src={video.thumbnailUrl}
          />
          {video.isPro ? (
            <Badge className="absolute left-2 top-2 gap-1 bg-[#ffc400] text-white shadow-sm" variant="warning">
              <Crown size={12} /> PRO
            </Badge>
          ) : null}
          <Badge className={cn("absolute top-2 gap-1 rounded-md bg-[#272852]/95 text-white", video.isPro ? "left-[76px]" : "left-2")}>
            <Headphones size={12} /> {formatNumber(video.viewCount || 0)}
          </Badge>
          <Badge className="absolute right-2 top-2 rounded-md bg-[#d7f8df] text-[#0e5f33] md:text-lg">
            {video.level || "A2"}
          </Badge>
          <Badge className="absolute bottom-2 left-2 gap-1 rounded-md bg-red-50 text-red-700" variant="youtube">
            <span className="text-[10px]">▶</span> Youtube
          </Badge>
          <Badge className="absolute bottom-2 right-2 gap-1 rounded-md bg-[#272852]/95 text-white">
            ◷ {formatDuration(video.duration || 64)}
          </Badge>
        </div>
      </Link>

      <CardContent className="space-y-3 p-3 md:p-4">
        <Link
          className={cn(
            "line-clamp-2 block min-h-[36px] text-[13px] font-black leading-snug text-[#202235] hover:underline md:text-base",
            isFeatured && "text-[#eb7100]",
          )}
          onClick={(event) => usingDemo && event.preventDefault()}
          to={detailPath}
        >
          {video.title}
        </Link>

        <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-[#202235] md:text-sm">
          <Button asChild className="h-auto justify-start gap-1 p-0 text-[12px] md:text-sm" variant="ghost">
            <Link onClick={(event) => usingDemo && event.preventDefault()} to={usingDemo ? "/" : `/videos/${video._id}?mode=dictation`}>
              Dictation <X className="text-slate-400" size={13} />
            </Link>
          </Button>
          <Button asChild className="h-auto justify-end gap-1 p-0 text-[12px] md:text-sm" variant="ghost">
            <Link onClick={(event) => usingDemo && event.preventDefault()} to={usingDemo ? "/" : `/videos/${video._id}?mode=shadowing`}>
              Shadowing <X className="text-slate-400" size={13} />
            </Link>
          </Button>
        </div>

        {isAdmin && !usingDemo ? (
          <div className="flex gap-2 border-t border-[#d8e1ed] pt-3">
            <Button
              onClick={() => publishVideoMutation.mutate({ id: video._id, isPublished: !video.isPublished })}
              size="sm"
              type="button"
              variant="outline"
            >
              {video.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              onClick={() => {
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

function AddVideoDialog({ createTopicMutation, createVideoMutation, onVideoCreated, topics }) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [videoForm, setVideoForm] = useState({
    topicId: "",
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: false,
  });

  async function handleCreateTopic(event) {
    event.preventDefault();
    if (!topicName.trim()) return;
    await createTopicMutation.mutateAsync({ name: topicName.trim(), isPublished: true });
    setTopicName("");
  }

  async function handleCreateVideo(event) {
    event.preventDefault();
    const response = await createVideoMutation.mutateAsync({
      ...videoForm,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
    });
    const video = response.data.data.video;
    setVideoForm({ topicId: "", youtubeUrl: "", title: "", description: "", level: "A2", isPublished: false });
    setIsOpen(false);
    onVideoCreated(video);
  }

  return (
    <div className="flex justify-end px-3 md:px-0">
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-xl">
            <Plus size={16} /> Thêm video
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm video YouTube</DialogTitle>
            <DialogDescription>
              Video mới mặc định chưa publish. Kiểm tra transcript xong rồi publish.
            </DialogDescription>
          </DialogHeader>

          <form className="flex gap-2" onSubmit={handleCreateTopic}>
            <Input
              onChange={(event) => setTopicName(event.target.value)}
              placeholder="Tạo nhanh topic mới"
              value={topicName}
            />
            <Button disabled={createTopicMutation.isPending} type="submit" variant="outline">
              Thêm topic
            </Button>
          </form>

          <form className="grid gap-3" onSubmit={handleCreateVideo}>
            <Select
              onValueChange={(value) => setVideoForm((current) => ({ ...current, topicId: value }))}
              value={videoForm.topicId || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic._id} value={topic._id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {createVideoMutation.error ? (
              <p className="text-sm font-bold text-red-600">
                {createVideoMutation.error.response?.data?.message || "Không thêm được video."}
              </p>
            ) : null}
            <Button disabled={createVideoMutation.isPending || !videoForm.topicId} type="submit">
              {createVideoMutation.isPending ? "Đang phân tích transcript..." : "Thêm video"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function groupByTopic(items) {
  const groups = new Map();

  for (const item of items) {
    const name = item.topicId?.name || "Movie short clip";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }

  return Array.from(groups.entries()).map(([name, videos]) => ({
    name,
    total: videos.length,
    items: videos,
  }));
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
