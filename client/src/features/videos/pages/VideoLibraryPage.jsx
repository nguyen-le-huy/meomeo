import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import LatestReadingCard from "../../reading/components/LatestReadingCard.jsx";
import { useReadings } from "../../reading/hooks/useReadings.js";
import { normalizeReading } from "../../reading/utils/readingFormat.js";
import {
  useCreateTopic,
  useCreateVideo,
  useDeleteTopic,
  useDeleteVideo,
  useMyShadowingSessions,
  usePublishVideo,
  useReorderTopics,
  useTopics,
  useUpdateTopic,
  useUpdateVideo,
  useVideos,
} from "../hooks/useVideoLearning.js";
import LearningModeDialog from "../components/LearningModeDialog.jsx";
import TopicVideoSection from "../components/TopicVideoSection.jsx";
import VideoLibraryAdminActions from "../components/VideoLibraryAdminActions.jsx";
import VideoLibraryEmptyState from "../components/VideoLibraryEmptyState.jsx";
import VideoLibraryErrorState from "../components/VideoLibraryErrorState.jsx";
import VideoLibraryHero from "../components/VideoLibraryHero.jsx";
import { homeTopicVideoLimit } from "../constants/videoLibrary.constants.js";
import { buildTopicSections, getNewestVideoIds } from "../utils/videoLibrary.js";

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const {
    data: videos = [],
    error: videosError,
    isError: isVideosError,
    isLoading,
    refetch: refetchVideos,
  } = useVideos({ includeUnpublished: isAdmin || undefined });
  const { data: topics = [], isLoading: isTopicsLoading } = useTopics({ includeUnpublished: isAdmin || undefined });
  const createVideoMutation = useCreateVideo();
  const createTopicMutation = useCreateTopic();
  const updateTopicMutation = useUpdateTopic();
  const reorderTopicsMutation = useReorderTopics();
  const deleteTopicMutation = useDeleteTopic();
  const updateVideoMutation = useUpdateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const sessionId = getGuestSessionId();
  const { data: myShadowingSessions = [] } = useMyShadowingSessions(sessionId);
  const { data: readings = [] } = useReadings({ includeUnpublished: isAdmin || undefined });
  const readingLessons = useMemo(() => readings.map(normalizeReading).filter(Boolean), [readings]);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topicSections = useMemo(
    () => buildTopicSections({ isAdmin, topics: visibleTopics, videos }),
    [isAdmin, visibleTopics, videos],
  );
  const shadowingSessionByVideoId = useMemo(
    () => new Map(myShadowingSessions.map((session) => [String(session.videoId), session])),
    [myShadowingSessions],
  );
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
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-12 sm:px-6 lg:px-10 lg:pt-20">
        <VideoLibraryHero />
        <LatestReadingCard
          lessons={readingLessons}
          onManage={isAdmin ? () => navigate("/admin/readings") : undefined}
          onOpen={(readingLesson) => navigate(`/reading/${readingLesson.slug}`)}
        />

        <div className="mb-8 mt-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Thư viện theo topic</p>
            <h2 className="mt-2 font-display text-2xl font-normal tracking-tight sm:text-3xl">Chọn chủ đề hôm nay</h2>
          </div>
          {isAdmin ? (
            <VideoLibraryAdminActions
              createTopicMutation={createTopicMutation}
              createVideoMutation={createVideoMutation}
              deleteTopicMutation={deleteTopicMutation}
              reorderTopicsMutation={reorderTopicsMutation}
              onVideoCreated={(video) => navigate(`/videos/${video._id}`)}
              topics={visibleTopics}
              updateTopicMutation={updateTopicMutation}
            />
          ) : null}
        </div>

        {isLoading || isTopicsLoading ? <p className="px-3 text-sm font-bold md:px-0">Đang tải thư viện...</p> : null}

        {isVideosError ? (
          <VideoLibraryErrorState error={videosError} onRetry={() => refetchVideos()} />
        ) : null}

        {!isLoading && !isVideosError && videos.length === 0 ? <VideoLibraryEmptyState /> : null}

        {topicSections.length > 0 ? (
          <div className="space-y-8">
            {topicSections.map((section) => {
              const sectionVideos = section.videos.slice(0, homeTopicVideoLimit);
              const canExpand = section.topic?.slug && section.videos.length > homeTopicVideoLimit;
              const newestVideoIds = getNewestVideoIds(section.videos);

              return (
                <TopicVideoSection
                  canExpand={canExpand}
                  deleteVideoMutation={deleteVideoMutation}
                  isAdmin={isAdmin}
                  key={section.key}
                  newestVideoIds={newestVideoIds}
                  onSelectVideo={(video) => setModePickerVideo(video)}
                  onViewAll={() => navigate(`/topics/${section.topic.slug}`)}
                  publishVideoMutation={publishVideoMutation}
                  section={section}
                  shadowingSessionByVideoId={shadowingSessionByVideoId}
                  topics={visibleTopics}
                  updateVideoMutation={updateVideoMutation}
                  videos={sectionVideos}
                />
              );
            })}
          </div>
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
