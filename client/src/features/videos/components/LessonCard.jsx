import { CheckCircle2, Clock3, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { cn } from "../../../utils/cn.js";
import { formatDuration, getTopicId } from "../utils/videoLibrary.js";

function getChannelName(video, topics, rawTopicId) {
  if (video.channelTitle) return video.channelTitle;
  const topic = topics.find((item) => item._id === rawTopicId);
  return topic?.name || "YouTube";
}

function getRelativeTime(dateValue) {
  const timestamp = new Date(dateValue || Date.now()).getTime();
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return "hôm nay";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  if (diffDays < 365) {
    const months = Math.max(1, Math.floor(diffDays / 30));
    return `${months} tháng trước`;
  }

  const years = Math.max(1, Math.floor(diffDays / 365));
  return `${years} năm trước`;
}

export default function LessonCard({
  deleteVideoMutation,
  isAdmin,
  isNew,
  onSelect,
  publishVideoMutation,
  shadowingSession,
  topics,
  updateVideoMutation,
  video,
}) {
  const isFeatured = isNew;
  const rawTopicId = getTopicId(video);
  const currentTopicValue = topics.some((topic) => topic._id === rawTopicId) ? rawTopicId : "__none__";
  const isShadowingDone = shadowingSession?.status === "completed";
  const channelName = getChannelName(video, topics, rawTopicId);
  const viewCount = Number(video.viewCount || video.studyCount || 0);
  const metaText = `${viewCount.toLocaleString("vi-VN")} lượt xem • ${getRelativeTime(video.createdAt)}`;

  return (
    <article
      className={cn(
        "group cursor-pointer rounded-lg bg-transparent font-roboto outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-coral/35",
        isFeatured && "rounded-xl",
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
      <div className="relative aspect-video overflow-hidden rounded-lg bg-cream-strong">
        <img
          alt={video.title}
          className="h-full w-full object-cover transition duration-200 group-hover:brightness-[0.92]"
          loading="lazy"
          src={video.thumbnailUrl}
        />
        <Badge className="absolute bottom-1.5 right-1.5 gap-1 rounded bg-black/90 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          <Clock3 size={11} strokeWidth={2.4} /> {formatDuration(video.duration || 0)}
        </Badge>
        {isFeatured ? (
          <Badge className="absolute left-2 top-2 rounded bg-coral px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            Mới
          </Badge>
        ) : null}
        {isShadowingDone ? (
          <Badge className="absolute bottom-1.5 left-1.5 gap-1 rounded bg-emerald-700/95 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            <CheckCircle2 size={14} /> Done · {shadowingSession.averageScore || 0}đ
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_32px] gap-3 pt-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-medium leading-5 text-coal sm:text-base sm:leading-[1.35]">
            {video.title}
          </h3>
          <p className="mt-1 truncate text-sm font-medium leading-5 text-ink-muted">{channelName}</p>
          <p className="truncate text-sm font-medium leading-5 text-ink-muted">{metaText}</p>
          {!video.isPublished && isAdmin ? (
            <Badge className="mt-2 rounded bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">Nháp</Badge>
          ) : null}
        </div>

        <button
          aria-label="Tùy chọn video"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted opacity-80 transition hover:bg-cream-soft hover:text-coal group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <MoreVertical size={19} strokeWidth={2.3} />
        </button>
      </div>

      {isAdmin ? (
        <div className="mt-3 space-y-2 border-t border-[#e6dfd8] pt-3" onClick={(event) => event.stopPropagation()}>
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
    </article>
  );
}
