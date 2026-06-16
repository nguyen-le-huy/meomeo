import { ChevronLeft, ChevronRight, Headphones, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
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
  useCreateVideo,
  useDeleteVideo,
  usePublishVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";

const levels = ["A1", "A2", "B1", "B2", "C1"];
const pageSize = 8;

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [page, setPage] = useState(1);
  const { data: videos = [], isLoading } = useVideos({ includeUnpublished: isAdmin || undefined });
  const createVideoMutation = useCreateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const totalPages = Math.max(1, Math.ceil(videos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedVideos = videos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      </div>
    </section>
  );
}

function LessonCard({ deleteVideoMutation, isAdmin, publishVideoMutation, video, variant }) {
  const isFeatured = variant === "featured";
  const detailPath = `/videos/${video._id}`;

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-[16px] border-[#d8e1ed] bg-white shadow-[0_4px_0_#cbd5e1]",
        isFeatured && "border-2 border-[#f5bc00] bg-[#fff8e8] shadow-[0_4px_0_#9b7200]",
      )}
      data-lesson-card
    >
      <Link className="block" to={detailPath}>
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
      </Link>

      <CardContent className="space-y-3 p-3 md:p-4">
        <Link
          className={cn(
            "line-clamp-2 block min-h-[36px] text-[13px] font-black leading-snug text-[#202235] hover:underline md:text-base",
            isFeatured && "text-[#eb7100]",
          )}
          to={detailPath}
        >
          {video.title}
        </Link>

        <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-[#202235] md:text-sm">
          <Button asChild className="h-auto justify-start gap-1 p-0 text-[12px] md:text-sm" variant="ghost">
            <Link to={`/videos/${video._id}/dictation`}>
              Dictation <X className="text-slate-400" size={13} />
            </Link>
          </Button>
          <Button asChild className="h-auto justify-end gap-1 p-0 text-[12px] md:text-sm" variant="ghost">
            <Link to={`/videos/${video._id}?mode=shadowing`}>
              Shadowing <X className="text-slate-400" size={13} />
            </Link>
          </Button>
        </div>

        {isAdmin ? (
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

function AddVideoDialog({ createVideoMutation, onVideoCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: false,
  });

  async function handleCreateVideo(event) {
    event.preventDefault();
    const response = await createVideoMutation.mutateAsync({
      ...videoForm,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
    });
    const video = response.data.data.video;
    setVideoForm({ youtubeUrl: "", title: "", description: "", level: "A2", isPublished: false });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm video YouTube</DialogTitle>
          <DialogDescription>
            Video mới mặc định chưa publish. Kiểm tra transcript xong rồi publish.
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = Math.floor(total % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
