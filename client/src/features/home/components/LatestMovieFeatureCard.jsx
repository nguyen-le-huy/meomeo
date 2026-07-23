import { ArrowRight, Film, Play } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";

export default function LatestMovieFeatureCard({ movie, onOpenLibrary, onPlay }) {
  if (!movie) return null;

  return (
    <section aria-labelledby="latest-movie-title" className="border-b border-[#e6dfd8] py-8 sm:py-10">
      <article className="grid overflow-hidden rounded-xl bg-[#111] text-white shadow-[0_18px_44px_rgba(20,20,19,0.16)] sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <button
          aria-label={`Xem ${movie.title}`}
          className="group relative aspect-[2/3] w-full overflow-hidden bg-[#1b1b1b] text-left sm:aspect-auto sm:min-h-[330px]"
          onClick={onPlay}
          type="button"
        >
          {movie.poster ? (
            <img
              alt={`Poster phim ${movie.title}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              loading="eager"
              src={movie.poster}
            />
          ) : (
            <span className="grid h-full min-h-72 place-items-center text-white/35">
              <Film size={48} strokeWidth={1.4} />
            </span>
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5" />
          {movie.rating > 0 ? (
            <span className="absolute right-0 top-0 bg-[#f5cc29] px-3 py-2 text-sm font-black text-black">
              {movie.rating.toFixed(1)}
            </span>
          ) : null}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-black/45 text-white backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-white group-hover:text-black">
              <Play fill="currentColor" size={20} />
            </span>
          </span>
        </button>

        <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-8 sm:py-8 lg:px-12">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f19a7b]">
            Phim mới thêm
          </span>
          <h2 className="mt-3 max-w-[18ch] font-display text-3xl font-normal leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl" id="latest-movie-title">
            {movie.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-white/55 sm:text-sm">
            <span>{movie.year}</span>
            <span aria-hidden="true">•</span>
            <span>{movie.age}</span>
            <span aria-hidden="true">•</span>
            <span>{movie.duration}</span>
          </div>
          {movie.description ? (
            <p className="mt-4 max-w-2xl line-clamp-3 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              {movie.description}
            </p>
          ) : (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
              Xem phim với phụ đề English, tiếng Việt và chế độ song ngữ.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button className="bg-white text-black hover:bg-white/85" onClick={onPlay} size="lg">
              <Play fill="currentColor" size={18} /> Xem ngay
            </Button>
            <Button className="border-white/20 bg-white/[0.06] text-white hover:border-white/35 hover:bg-white/10" onClick={onOpenLibrary} size="lg" variant="outline">
              Tất cả phim <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </article>
    </section>
  );
}
