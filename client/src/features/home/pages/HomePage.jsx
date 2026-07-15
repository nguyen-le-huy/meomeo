import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useAuthStore } from "../../auth/stores/authStore.js";
import LearningModeDialog from "../../videos/components/LearningModeDialog.jsx";
import TopicVideoSection from "../../videos/components/TopicVideoSection.jsx";
import VideoLibraryAdminActions from "../../videos/components/VideoLibraryAdminActions.jsx";
import VideoLibraryEmptyState from "../../videos/components/VideoLibraryEmptyState.jsx";
import VideoLibraryErrorState from "../../videos/components/VideoLibraryErrorState.jsx";
import {
  heroCatUrl,
  homeTopicDesktopVideoLimit,
  homeTopicMobileVideoLimit,
  practiceCatUrl,
} from "../../videos/constants/videoLibrary.constants.js";
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
} from "../../videos/hooks/useVideoLearning.js";
import { buildTopicSections, getNewestVideoIds } from "../../videos/utils/videoLibrary.js";

function getGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 4 && hour < 12) return "chào buổi sáng";
  if (hour >= 12 && hour < 14) return "chào buổi trưa";
  if (hour >= 14 && hour < 18) return "chào buổi chiều";
  if (hour >= 18) return "chào buổi tối";

  return "chào buổi đêm";
}

function useIsDesktopTopicGrid() {
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

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [greeting, setGreeting] = useState(() => getGreeting());
  const [modePickerVideo, setModePickerVideo] = useState(null);
  const isDesktopTopicGrid = useIsDesktopTopicGrid();
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
  const sessionId = getGuestSessionId();
  const { data: myShadowingSessions = [] } = useMyShadowingSessions(sessionId);
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.slug !== "all-videos"), [topics]);
  const topicSections = useMemo(
    () => buildTopicSections({ isAdmin, topics: visibleTopics, videos }),
    [isAdmin, visibleTopics, videos],
  );
  const shadowingSessionByVideoId = useMemo(
    () => new Map(myShadowingSessions.map((session) => [String(session.videoId), session])),
    [myShadowingSessions],
  );
  const homeTopicVideoLimit = isDesktopTopicGrid ? homeTopicDesktopVideoLimit : homeTopicMobileVideoLimit;

  useEffect(() => {
    const intervalId = window.setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

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
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-5 overflow-hidden border-b border-[#e6dfd8] pb-8 pt-8 sm:gap-7 sm:pb-10 sm:pt-12 lg:min-h-[340px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:items-center lg:gap-10 lg:overflow-visible lg:pb-14 lg:pt-4">
          <div className="max-w-3xl">
            <h1 className="display-heading max-w-[340px] text-[30px] leading-[0.96] tracking-normal sm:max-w-xl sm:text-5xl lg:max-w-none lg:text-[56px] lg:leading-[0.96] xl:text-[64px]">
              meo meo {greeting}<br />Vào học ngay cho tớ.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-5 text-ink-body sm:mt-6 sm:text-base sm:leading-7">
              Chịu khó học vào con ranh này
            </p>
          </div>
          <div className="flex items-end justify-between gap-3 overflow-hidden sm:gap-5 lg:justify-end lg:gap-4 lg:overflow-visible">
            <img
              alt=""
              aria-hidden="true"
              className="h-[112px] w-auto max-w-none object-contain sm:h-[190px] lg:h-60 xl:h-64"
              src={heroCatUrl}
            />
            <img
              alt=""
              aria-hidden="true"
              className="h-[112px] w-auto max-w-none object-contain sm:h-[182px] lg:h-56 xl:h-60"
              src={practiceCatUrl}
            />
          </div>
        </div>

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
              onVideoCreated={(video) => navigate(`/videos/${video._id}`)}
              reorderTopicsMutation={reorderTopicsMutation}
              topics={visibleTopics}
              updateTopicMutation={updateTopicMutation}
            />
          ) : null}
        </div>

        {isLoading || isTopicsLoading ? <LoadingState label="Đang tải thư viện..." /> : null}

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
