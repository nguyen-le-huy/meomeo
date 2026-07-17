import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import LessonCard from "./LessonCard.jsx";

export default function TopicVideoSection({
  canExpand,
  deleteVideoMutation,
  isAdmin,
  newestVideoIds,
  onSelectVideo,
  onViewAll,
  publishVideoMutation,
  section,
  shadowingSessionByVideoId,
  topics,
  updateVideoMutation,
  videos,
}) {
  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-[#e6dfd8] pb-3 sm:pb-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:text-xs">
            Chủ đề
          </p>
          <div className="flex min-w-0 items-center gap-2.5">
            <h3 className="truncate text-lg font-semibold text-coal sm:text-2xl">{section.title}</h3>
            <span className="shrink-0 rounded-full bg-cream-soft px-2.5 py-1 text-[11px] font-semibold text-ink-muted sm:text-xs">
              {section.videos.length} bài
            </span>
          </div>
          {section.description ? (
            <p className="mt-1 line-clamp-1 text-xs leading-5 text-ink-muted sm:text-sm">{section.description}</p>
          ) : null}
        </div>
        {canExpand ? (
          <Button
            className="h-9 shrink-0 px-2 text-xs text-ink-body hover:bg-cream-soft sm:px-3 sm:text-sm"
            onClick={onViewAll}
            type="button"
            variant="ghost"
          >
            Xem tất cả <ArrowRight size={15} />
          </Button>
        ) : null}
      </div>

      {videos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4" data-lesson-grid>
          {videos.map((video) => (
            <LessonCard
              deleteVideoMutation={deleteVideoMutation}
              isAdmin={isAdmin}
              isNew={newestVideoIds.has(video._id)}
              key={video._id}
              onSelect={() => onSelectVideo(video)}
              publishVideoMutation={publishVideoMutation}
              shadowingSession={shadowingSessionByVideoId?.get(String(video._id))}
              topics={topics}
              updateVideoMutation={updateVideoMutation}
              video={video}
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
