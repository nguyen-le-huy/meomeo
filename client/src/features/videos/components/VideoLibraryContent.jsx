import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  homeInitialDesktopVideoLimit,
  homeInitialMobileVideoLimit,
  homeVideoLoadBatchSize,
} from "../constants/videoLibrary.constants.js";
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
import { useLazyTopicSections } from "../hooks/useLazyTopicSections.js";
import { buildTopicSections, getNewestVideoIds, interleaveTopicSections } from "../utils/videoLibrary.js";
import LearningModeDialog from "./LearningModeDialog.jsx";
import LessonCard from "./LessonCard.jsx";
import TopicCategoryChips, { allTopicsValue } from "./TopicCategoryChips.jsx";
import VideoLibraryAdminActions from "./VideoLibraryAdminActions.jsx";
import VideoLibraryEmptyState from "./VideoLibraryEmptyState.jsx";
import VideoLibraryErrorState from "./VideoLibraryErrorState.jsx";

const videosPerCategoryTurn = 4;

function roundUpToCategoryTurn(value) {
  return Math.ceil(value / videosPerCategoryTurn) * videosPerCategoryTurn;
}

function useIsDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

export default function VideoLibraryContent({
  className = "",
  showCategoryList = true,
  title = "Học qua Youtube",
}) {
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
  const { data: topics = [], isLoading: isTopicsLoading } = useTopics({
    includeUnpublished: isAdmin || undefined,
  });
  const createVideoMutation = useCreateVideo();
  const createTopicMutation = useCreateTopic();
  const updateTopicMutation = useUpdateTopic();
  const reorderTopicsMutation = useReorderTopics();
  const deleteTopicMutation = useDeleteTopic();
  const updateVideoMutation = useUpdateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(allTopicsValue);
  const isDesktopViewport = useIsDesktopViewport();
  const sessionId = getGuestSessionId();
  const { data: myShadowingSessions = [] } = useMyShadowingSessions(sessionId);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topicSections = useMemo(
    () => buildTopicSections({ isAdmin, topics: visibleTopics, videos }),
    [isAdmin, visibleTopics, videos],
  );
  const categoryTopics = useMemo(() => {
    const videoCountByTopicId = new Map(
      topicSections
        .filter((section) => section.topic?._id)
        .map((section) => [section.topic._id, section.videos.length]),
    );
    const topicsWithCounts = visibleTopics.map((topic) => ({
      ...topic,
      videoCount: videoCountByTopicId.get(topic._id) || 0,
    }));

    if (isAdmin) return topicsWithCounts;
    return topicsWithCounts.filter((topic) => topic.videoCount > 0);
  }, [isAdmin, topicSections, visibleTopics]);
  const filteredTopicSections = useMemo(() => {
    if (!showCategoryList || selectedTopicId === allTopicsValue) {
      return interleaveTopicSections(topicSections, videosPerCategoryTurn);
    }
    return topicSections.filter((section) => section.topic?._id === selectedTopicId);
  }, [selectedTopicId, showCategoryList, topicSections]);
  const isShowingAllTopics = !showCategoryList || selectedTopicId === allTopicsValue;
  const baseInitialVideoLimit = isDesktopViewport
    ? homeInitialDesktopVideoLimit
    : homeInitialMobileVideoLimit;
  const initialVideoLimit = isShowingAllTopics
    ? roundUpToCategoryTurn(baseInitialVideoLimit)
    : baseInitialVideoLimit;
  const videoLoadBatchSize = isShowingAllTopics
    ? roundUpToCategoryTurn(homeVideoLoadBatchSize)
    : homeVideoLoadBatchSize;
  const {
    hasMoreSections,
    loadMoreRef,
    visibleSections: visibleTopicSections,
  } = useLazyTopicSections(filteredTopicSections, {
    batchSize: videoLoadBatchSize,
    initialCount: initialVideoLimit,
  });
  const shadowingSessionByVideoId = useMemo(
    () => new Map(myShadowingSessions.map((session) => [String(session.videoId), session])),
    [myShadowingSessions],
  );
  const visibleVideoItems = useMemo(() => {
    const newestVideoIds = new Set(
      topicSections.flatMap((section) => [...getNewestVideoIds(section.videos)]),
    );
    return visibleTopicSections.flatMap((section) =>
      section.videos.map((video) => ({
        isNew: newestVideoIds.has(video._id),
        video,
      })),
    );
  }, [topicSections, visibleTopicSections]);

  useEffect(() => {
    if (!showCategoryList || selectedTopicId === allTopicsValue) return;
    if (!categoryTopics.some((topic) => topic._id === selectedTopicId)) {
      setSelectedTopicId(allTopicsValue);
    }
  }, [categoryTopics, selectedTopicId, showCategoryList]);

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
    <section className={className}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="mt-2 font-display text-2xl font-normal tracking-tight sm:text-3xl">{title}</h2>
        {isAdmin ? (
          <VideoLibraryAdminActions
            createTopicMutation={createTopicMutation}
            createVideoMutation={createVideoMutation}
            deleteTopicMutation={deleteTopicMutation}
            onVideoCreated={(video) => navigate(`/videos/${video._id}/bilingual`)}
            reorderTopicsMutation={reorderTopicsMutation}
            topics={visibleTopics}
            updateTopicMutation={updateTopicMutation}
          />
        ) : null}
      </div>

      {showCategoryList ? (
        <TopicCategoryChips
          onSelectTopic={setSelectedTopicId}
          selectedTopicId={selectedTopicId}
          topics={categoryTopics}
        />
      ) : null}

      {isLoading || isTopicsLoading ? <LoadingState label="Đang tải thư viện..." /> : null}
      {isVideosError ? (
        <VideoLibraryErrorState error={videosError} onRetry={() => refetchVideos()} />
      ) : null}
      {!isLoading && !isVideosError && videos.length === 0 ? <VideoLibraryEmptyState /> : null}

      {visibleVideoItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3" data-lesson-grid>
            {visibleVideoItems.map(({ isNew, video }) => (
              <LessonCard
                deleteVideoMutation={deleteVideoMutation}
                isAdmin={isAdmin}
                isNew={isNew}
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
          {hasMoreSections ? <div aria-hidden="true" className="h-8" ref={loadMoreRef} /> : null}
        </>
      ) : null}

      <LearningModeDialog
        onOpenChange={(isOpen) => {
          if (!isOpen) setModePickerVideo(null);
        }}
        onSelectMode={startLearning}
        open={Boolean(modePickerVideo)}
      />
    </section>
  );
}
