import { Headphones, Trash2 } from "lucide-react";
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
import { formatDuration, formatNumber, getTopicId } from "../utils/videoLibrary.js";

export default function LessonCard({ deleteVideoMutation, isAdmin, onSelect, publishVideoMutation, topics, updateVideoMutation, video, variant }) {
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
