import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
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

const lessonCategories = [
  {
    title: "Học qua YouTube",
    description: "Shadowing, dictation, vietsub song ngữ",
    to: "/youtube",
    gifUrl: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDdvNG44emNxbTl2NWg5ZDJpYTAyd2dxN2d1N3c5Z2RjNzl2dXhoZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3eZRwwX91t7xSaNkaE/giphy.gif",
    className: "border-[#f4c7b0] bg-[#fff4ed] text-[#35231c]",
    badgeClassName: "bg-[#ffe1d2] text-[#a84420]",
    layerClassName: "bg-[#f2a17d]",
  },
  {
    title: "Từ vựng mỗi ngày",
    description: "Bài đọc ngắn để học từ mới",
    to: "/vocabulary",
    gifUrl: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWtlMzdneWtnZDJqajA0OXlsYTZlcjVmNjBodTBwZmtsMnJzZ2JmOCZlcD12MV9pbnRlcm5hbF9naWQmY3Q9cw/ggpoVsIg0LwtHfTBEY/giphy.gif",
    className: "border-[#a9ddd3] bg-[#eafaf6] text-[#153b35]",
    badgeClassName: "bg-[#ccefe7] text-[#117064]",
    layerClassName: "bg-[#62c6b4]",
  },
  {
    title: "Ebook",
    description: "Đọc sách",
    to: "/ebooks",
    gifUrl: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExenhqbHFkMHQyZ285b2libW52YnptYnRvY21sM25pd21tbGo3cmZsNiZlcD12MV9pbnRlcm5hbF9naWQmY3Q9cw/RXG7XYXYV4JQBt2i7h/giphy.gif",
    className: "border-[#cfc1ef] bg-[#f4f0ff] text-[#30264d]",
    badgeClassName: "bg-[#e4dcfa] text-[#6546a5]",
    layerClassName: "bg-[#a995df]",
  },
  {
    title: "Từ đã tra",
    description: "Xem lại lịch sử tra từ",
    to: "/dictionary/history",
    gifUrl: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2xmNWM1c3lhbXFmdm1yMmZ3cmN0MHl0ajJiaXFuZXkwNXJkNGY1OSZlcD12MV9pbnRlcm5hbF9naWQmY3Q9cw/H2Uj3lf7jVd62AAivr/giphy.gif",
    className: "border-[#efd38b] bg-[#fff8df] text-[#443711]",
    badgeClassName: "bg-[#ffebad] text-[#7a5b00]",
    layerClassName: "bg-[#e9bd45]",
  },
];

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

        <div className="border-b border-[#e6dfd8] py-8 sm:py-10">
          <div className="mb-5">
            <h2 className="mt-2 font-display text-2xl font-normal tracking-tight sm:text-3xl">Chọn loại bài học</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {lessonCategories.map((category) => {
              return (
                <button
                  className={`lesson-category-card group relative h-[188px] overflow-hidden rounded-lg border p-3 pb-5 text-left shadow-[0_8px_22px_rgba(20,20,19,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 sm:h-[184px] sm:p-5 sm:pb-7 lg:h-[200px] ${category.className}`}
                  key={category.to}
                  onClick={() => navigate(category.to)}
                  type="button"
                >
                  <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-3 sm:h-4 ${category.layerClassName}`} />
                  <img alt="" aria-hidden="true" className="lesson-category-gif absolute bottom-3 right-0 z-[1] h-[72%] w-[48%] object-contain object-right-bottom sm:bottom-4 sm:h-[78%] sm:w-[50%]" loading="lazy" src={category.gifUrl} />
                  <span className={`relative z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase sm:px-2.5 sm:text-[10px] ${category.badgeClassName}`}>
                    Mở <ArrowUpRight size={12} strokeWidth={2.8} />
                  </span>
                  <span className="relative z-10 mt-8 block max-w-[58%] text-[15px] font-black leading-[1.15] sm:mt-10 sm:text-xl">{category.title}</span>
                  <span className="relative z-10 mt-2 block max-w-[58%] text-[10px] font-semibold leading-[1.35] opacity-75 sm:text-xs sm:leading-4">{category.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8 mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="mt-2 font-display text-2xl font-normal tracking-tight sm:text-3xl">Học qua Youtube</h2>
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
