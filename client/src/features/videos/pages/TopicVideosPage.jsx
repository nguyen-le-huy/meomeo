import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useDeleteVideo,
  useMyShadowingSessions,
  usePublishVideo,
  useTopics,
  useUpdateVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";
import LearningModeDialog from "../components/LearningModeDialog.jsx";
import LessonCard from "../components/LessonCard.jsx";
import { getNewestVideoIds, getTopicId } from "../utils/videoLibrary.js";

const pageSize = 9;

export default function TopicVideosPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const listTopRef = useRef(null);
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
  const sessionId = getGuestSessionId();
  const { data: myShadowingSessions = [] } = useMyShadowingSessions(sessionId);
  const [currentPage, setCurrentPage] = useState(1);
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topic = useMemo(() => visibleTopics.find((item) => item.slug === slug), [slug, visibleTopics]);
  const topicVideos = useMemo(() => {
    if (!topic?._id) return [];
    return videos.filter((video) => getTopicId(video) === topic._id);
  }, [topic?._id, videos]);
  const newestVideoIds = useMemo(() => getNewestVideoIds(topicVideos), [topicVideos]);
  const totalPages = Math.max(1, Math.ceil(topicVideos.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const visibleVideos = topicVideos.slice(pageStart, pageStart + pageSize);
  const isLoading = isTopicsLoading || isVideosLoading;
  const shadowingSessionByVideoId = useMemo(
    () => new Map(myShadowingSessions.map((session) => [String(session.videoId), session])),
    [myShadowingSessions],
  );

  useEffect(() => {
    setCurrentPage(1);
    setModePickerVideo(null);
  }, [slug]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

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

        {isLoading ? <LoadingState label="Đang tải topic..." /> : null}

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
            <div className="mb-6 scroll-mt-16 border-b border-[#e6dfd8] pb-4 md:scroll-mt-20" ref={listTopRef}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Chủ đề</p>
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-semibold text-coal sm:text-3xl">{topic.name}</h1>
                <span className="rounded-full bg-cream-soft px-2.5 py-1 text-xs font-semibold text-ink-muted">
                  {topicVideos.length} bài
                </span>
              </div>
              {topic.description ? <p className="mt-1 text-sm text-ink-muted">{topic.description}</p> : null}
            </div>

            {topicVideos.length ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {visibleVideos.map((video) => (
                  <LessonCard
                    deleteVideoMutation={deleteVideoMutation}
                    isAdmin={isAdmin}
                    isNew={newestVideoIds.has(video._id)}
                    key={video._id}
                    onSelect={() => setModePickerVideo(video)}
                    publishVideoMutation={publishVideoMutation}
                    shadowingSession={shadowingSessionByVideoId.get(String(video._id))}
                    topics={visibleTopics}
                    updateVideoMutation={updateVideoMutation}
                    video={video}
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

            {topicVideos.length > pageSize ? (
              <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-[#e6dfd8] pt-5">
                <Button className="justify-self-start" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)} size="sm" type="button" variant="outline"><ArrowLeft size={15} /><span><span className="hidden sm:inline">Trang </span>trước</span></Button>
                <p className="text-center text-xs font-semibold text-ink-muted">Trang {currentPage} / {totalPages}</p>
                <Button className="justify-self-end" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)} size="sm" type="button" variant="outline"><span><span className="hidden sm:inline">Trang </span>sau</span><ArrowRight size={15} /></Button>
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
