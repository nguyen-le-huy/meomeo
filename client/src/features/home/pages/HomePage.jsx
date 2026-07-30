import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAuthStore } from "../../auth/stores/authStore.js";
import { useMovieAdminMutations, useMovieLibrary } from "../../movies/hooks/useMovies.js";
import { normalizeMovie } from "../../movies/utils/movieData.js";
import ManageHomeHeroDialog from "../../movies/components/ManageHomeHeroDialog.jsx";
import VideoLibraryContent from "../../videos/components/VideoLibraryContent.jsx";
import {
  heroCatUrl,
  practiceCatUrl,
} from "../../videos/constants/videoLibrary.constants.js";
import LatestMovieFeatureCard from "../components/LatestMovieFeatureCard.jsx";

const lessonCategories = [
  {
    title: "Học qua YouTube",
    description: "Shadowing, dictation, song ngữ",
    to: "/youtube",
    gifUrl: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDdvNG44emNxbTl2NWg5ZDJpYTAyd2dxN2d1N3c5Z2RjNzl2dXhoZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3eZRwwX91t7xSaNkaE/giphy.gif",
    className: "border-[#f4c7b0] bg-[#fff4ed] text-[#35231c]",
    badgeClassName: "bg-[#ffe1d2] text-[#a84420]",
    layerClassName: "bg-[#f2a17d]",
  },
  {
    title: "Netflix Chill",
    description: "Xem phim đi",
    to: "/netflix",
    gifUrl: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTVpMG5zbnpyaWYzeDd1dTFuZWVmMDJzYzR3aWtjM2t5YXhoMXBmOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/YqhFT4yCuUO51FazQz/giphy.gif",
    className: "border-[#d7c2c2] bg-[#fff1f1] text-[#341717]",
    badgeClassName: "bg-[#ffdada] text-[#a51f1f]",
    layerClassName: "bg-[#e50914]",
  },
  {
    title: "Từ vựng mỗi ngày",
    description: "Học từ vựng nhiều vô",
    to: "/vocabulary",
    gifUrl: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWtlMzdneWtnZDJqajA0OXlsYTZlcjVmNjBodTBwZmtsMnJzZ2JmOCZlcD12MV9pbnRlcm5hbF9naWQmY3Q9cw/ggpoVsIg0LwtHfTBEY/giphy.gif",
    className: "border-[#a9ddd3] bg-[#eafaf6] text-[#153b35]",
    badgeClassName: "bg-[#ccefe7] text-[#117064]",
    layerClassName: "bg-[#62c6b4]",
  },
  {
    title: "Ebook",
    description: "Đọc sách cho tau",
    to: "/ebooks",
    gifUrl: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExenhqbHFkMHQyZ285b2libW52YnptYnRvY21sM25pd21tbGo3cmZsNiZlcD12MV9pbnRlcm5hbF9naWQmY3Q9cw/RXG7XYXYV4JQBt2i7h/giphy.gif",
    className: "border-[#cfc1ef] bg-[#f4f0ff] text-[#30264d]",
    badgeClassName: "bg-[#e4dcfa] text-[#6546a5]",
    layerClassName: "bg-[#a995df]",
  },
  {
    title: "Từ đã tra",
    description: "Lịch sử tra từ",
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

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [greeting, setGreeting] = useState(() => getGreeting());
  const latestMovieQuery = useMovieLibrary({});
  const movieMutations = useMovieAdminMutations();
  const latestMovie = useMemo(() => {
    if (latestMovieQuery.data?.homeFeaturedMovie) {
      return normalizeMovie(latestMovieQuery.data.homeFeaturedMovie);
    }
    const newest = [...(latestMovieQuery.data?.movies || [])]
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())[0];
    return newest ? normalizeMovie(newest) : null;
  }, [latestMovieQuery.data]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

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

        <div className="relative">
          {isAdmin ? (
            <div className="absolute right-4 top-12 z-20 sm:right-6 sm:top-14 lg:right-8 lg:top-14">
              <ManageHomeHeroDialog
                featuredMovie={latestMovieQuery.data?.homeFeaturedMovie}
                movies={latestMovieQuery.data?.movies || []}
                mutation={movieMutations.setHomeHero}
              />
            </div>
          ) : null}
          <LatestMovieFeatureCard
            movie={latestMovie}
            onOpenLibrary={() => navigate("/netflix")}
            onPlay={() => navigate(`/netflix/${latestMovie?.id}`)}
          />
        </div>

        <div className="border-b border-[#e6dfd8] py-8 sm:py-10">
          <div className="mb-5">
            <h2 className="mt-2 font-display text-2xl font-normal tracking-tight sm:text-3xl">Chọn loại bài học</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-5">
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

        <VideoLibraryContent className="mt-10" />
      </div>
    </section>
  );
}
