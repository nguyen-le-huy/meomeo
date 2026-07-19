import { Card, CardContent } from "../../../components/ui/card.jsx";
import LessonCard from "./LessonCard.jsx";

export default function TopicVideoSection({
  deleteVideoMutation,
  isAdmin,
  newestVideoIds,
  onSelectVideo,
  publishVideoMutation,
  shadowingSessionByVideoId,
  topics,
  updateVideoMutation,
  videos,
}) {
  return (
    <section>
      {videos.length ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3" data-lesson-grid>
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
