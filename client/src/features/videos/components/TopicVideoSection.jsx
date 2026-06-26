import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import LessonCard from "./LessonCard.jsx";

export default function TopicVideoSection({
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
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-9 w-1 shrink-0 rounded-full bg-[#303866]" />
            <h3 className="truncate text-base text-black tracking-tight text-[#202036] sm:text-xl lg:text-xl">{section.title}</h3>
            <span className="shrink-0 text-xs font-semibold text-[#46516d] sm:text-sm">({section.videos.length} bài học)</span>
          </div>
          {section.description ? (
            <p className="ml-4 mt-1 line-clamp-1 text-sm text-ink-muted">{section.description}</p>
          ) : null}
        </div>
        {canExpand ? (
          <Button
            className="shrink-0 rounded-2xl border-[#bfc4d3] bg-canvas px-3 text-[0.65rem] font-black uppercase tracking-[0.08em] text-[#303866] shadow-[0_3px_0_rgba(48,56,102,0.16)] sm:px-4 sm:text-sm sm:tracking-[0.12em]"
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
