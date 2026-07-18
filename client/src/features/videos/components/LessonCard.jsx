import { ArrowUpRight, CheckCircle2, CirclePlay, Clock3, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { cn } from "../../../utils/cn.js";
import { formatDuration, getTopicId } from "../utils/videoLibrary.js";

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

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden rounded-lg border-[#e6dfd8] bg-canvas outline-none transition duration-200 hover:-translate-y-0.5 hover:border-[#d2c9be] hover:shadow-[0_10px_24px_rgba(20,20,19,0.09)] focus-visible:ring-2 focus-visible:ring-coral/30",
        isFeatured && "border-coral/35 bg-coral/5 shadow-[0_6px_18px_rgba(204,120,92,0.10)] hover:border-coral/55",
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
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
          loading="lazy"
          src={video.thumbnailUrl}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <Badge className="absolute bottom-2 right-2 gap-1 bg-coal/85 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:bottom-3 sm:right-3 sm:text-xs">
          <Clock3 size={12} strokeWidth={2.2} /> {formatDuration(video.duration || 0)}
        </Badge>
        {isFeatured ? (
          <Badge className="absolute left-2 top-2 bg-coral px-2 py-1 text-[10px] font-semibold text-white shadow-sm sm:left-3 sm:top-3 sm:text-xs">
            Mới
          </Badge>
        ) : null}
        {isShadowingDone ? (
          <Badge className="absolute bottom-2 left-2 gap-1 bg-emerald-700/90 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-xs">
            <CheckCircle2 size={14} /> Done · {shadowingSession.averageScore || 0}đ
          </Badge>
        ) : null}
      </div>

      <CardContent className="flex min-h-[104px] flex-col p-3 sm:min-h-[124px] sm:p-4">
        <p className="line-clamp-2 min-h-[36px] text-xs font-semibold leading-[1.45] text-coal sm:min-h-[42px] sm:text-[15px]">
          {video.title}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[10px] font-semibold text-ink-muted sm:text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2 py-1 font-bold text-red-700">
            <CirclePlay size={13} fill="currentColor" strokeWidth={2.4} />
            YouTube
          </span>
          <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Mở bài học <ArrowUpRight size={13} />
          </span>
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
      </CardContent>
    </Card>
  );
}
