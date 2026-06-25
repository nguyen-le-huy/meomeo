import { ArrowLeft, ArrowDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useDeleteVideo,
  usePublishVideo,
  useTopics,
  useUpdateVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";
import { getTopicId, LearningModeDialog, LessonCard } from "./VideoLibraryPage.jsx";

const pageSize = 8;

export default function TopicVideosPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { data: topics = [], isLoading: isTopicsLoading } = useTopics({ includeUnpublished: isAdmin || undefined });
  const {
    data: videos = [],
    error: videosError,
    isError: isVideosError,
    isLoading: isVideosLoading,
  } = useVideos({ includeUnpublished: isAdmin || undefined });
  const updateVideoMutation = useUpdateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topic = useMemo(() => visibleTopics.find((item) => item.slug === slug), [slug, visibleTopics]);
  const topicVideos = useMemo(() => {
    if (!topic?._id) return [];
    return videos.filter((video) => getTopicId(video) === topic._id);
  }, [topic?._id, videos]);
  const visibleVideos = topicVideos.slice(0, visibleCount);
  const hasMore = visibleCount < topicVideos.length;
  const isLoading = isTopicsLoading || isVideosLoading;

  useEffect(() => {
    setVisibleCount(pageSize);
    setModePickerVideo(null);
  }, [slug]);

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
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={() => navigate("/")} type="button" variant="outline">
            <ArrowLeft size={16} /> Thư viện
          </Button>
        </div>

        {isLoading ? <p className="text-sm font-bold text-ink-muted">Đang tải topic...</p> : null}

        {!isLoading && !topic ? (
          <Card className="border-dashed bg-cream-soft">
            <CardContent className="p-8 text-center">
              <p className="font-display text-2xl">Không tìm thấy topic.</p>
              <p className="mt-2 text-sm text-ink-muted">Topic có thể đã bị ẩn hoặc đã bị xóa.</p>
            </CardContent>
          </Card>
        ) : null}

        {isVideosError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-sm font-semibold text-red-700">
              {videosError?.response?.data?.message || "Không tải được video trong topic."}
            </CardContent>
          </Card>
        ) : null}

        {topic ? (
          <>
            <div className="mb-6 rounded-2xl border border-[#d8e1ed] bg-canvas px-5 py-4 shadow-[0_2px_0_rgba(20,20,19,0.08)]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-10 w-1.5 shrink-0 rounded-full bg-[#303866]" />
                <div className="min-w-0">
                  <h1 className="truncate text-3xl font-black tracking-tight text-[#202036]">{topic.name}</h1>
                  <p className="mt-1 text-sm font-semibold text-[#46516d]">
                    {topicVideos.length} bài học
                    {topic.description ? ` · ${topic.description}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {topicVideos.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {visibleVideos.map((video, index) => (
                  <LessonCard
                    deleteVideoMutation={deleteVideoMutation}
                    isAdmin={isAdmin}
                    key={video._id}
                    onSelect={() => setModePickerVideo(video)}
                    publishVideoMutation={publishVideoMutation}
                    topics={visibleTopics}
                    updateVideoMutation={updateVideoMutation}
                    video={video}
                    variant={index % 4 === 0 ? "featured" : "default"}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-cream-soft">
                <CardContent className="p-8 text-center text-sm font-semibold text-ink-muted">
                  Topic này chưa có video.
                </CardContent>
              </Card>
            )}

            {hasMore ? (
              <div className="mt-10 flex flex-col items-center gap-3">
                <Button
                  className="min-w-44"
                  onClick={() => setVisibleCount((count) => Math.min(count + pageSize, topicVideos.length))}
                  type="button"
                  variant="outline"
                >
                  Tải thêm 8 video <ArrowDown size={16} />
                </Button>
                <p className="text-xs text-ink-muted">
                  Đang hiển thị {visibleVideos.length} / {topicVideos.length} video
                </p>
              </div>
            ) : null}
          </>
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
