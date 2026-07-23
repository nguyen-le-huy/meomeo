import { ArrowRight, Clock, Film, Play } from "lucide-react";

export default function LatestMovieFeatureCard({ movie, onOpenLibrary, onPlay }) {
  if (!movie) return null;

  return (
    <section aria-labelledby="latest-movie-title" className="relative border-b border-[#e6dfd8] py-8 sm:py-10">
      <article className="relative flex flex-col rounded-2xl bg-[#13141a] text-white shadow-2xl sm:flex-row">
        
        {/* Poster */}
        <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl sm:w-[280px] sm:rounded-l-2xl sm:rounded-tr-none lg:w-[320px]">
          {movie.poster ? (
            <img
              alt={`Poster phim ${movie.title}`}
              className="h-full w-full object-cover"
              loading="eager"
              src={movie.poster}
            />
          ) : (
            <span className="grid h-full min-h-[400px] place-items-center bg-[#1b1b1b] text-white/35">
              <Film size={48} strokeWidth={1.4} />
            </span>
          )}
          {/* Subtle gradient overlay to blend with dark bg if needed */}
          <span className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-transparent to-[#13141a]/80 sm:block" />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8 lg:p-10">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f19a7b]">
            Phim mới
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px]" id="latest-movie-title">
            {movie.title}
          </h2>

          {/* Genres */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {["Thriller/Mystery", "Action", "Adventure", "Fantasy"].map((genre) => (
              <span key={genre} className="rounded-full bg-[#1f2029] px-4 py-1.5 text-xs font-medium text-white/70">
                {genre}
              </span>
            ))}
          </div>

          {/* Metadata */}
          <div className="mt-5 flex flex-wrap items-center gap-5 text-xs font-medium text-white/70 sm:text-sm">
            {movie.rating > 0 ? (
              <div className="flex items-center gap-1.5 font-bold">
                <img
                  alt="IMDb"
                  className="h-5 w-auto object-contain sm:h-6"
                  src="https://res.cloudinary.com/dq6rydlgi/image/upload/v1784519808/imdb_c1uo7v.png"
                />
                <span>{movie.rating.toFixed(1)}/10</span>
              </div>
            ) : null}
            {movie.age ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#fcb4a8] px-1.5 py-[2px] text-[10px] font-bold leading-none text-black sm:text-[11px]">
                  PG
                </span>
                <span>{movie.age}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#a3e6aa] text-black">
                <Clock size={12} strokeWidth={2.5} />
              </span>
              <span>{movie.duration}</span>
            </div>
          </div>

          {/* Description & Crew */}
          <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-16 flex-1">
            {/* Left side: Description & Buttons */}
            <div className="flex flex-1 flex-col">
              <p className="max-w-2xl text-sm leading-relaxed text-white/60 sm:text-[15px] sm:leading-7">
                {movie.description || "Xem phim với phụ đề English, tiếng Việt và chế độ song ngữ. Đây là một trải nghiệm tuyệt vời."}
              </p>

              <div className="mt-auto flex flex-wrap gap-4 pt-8">
                <button 
                  className="group flex h-11 items-center rounded-full bg-[#a9c2f0] pl-6 pr-1 text-sm font-bold text-[#1a1c23] transition hover:bg-[#92b0fa] sm:h-12"
                  onClick={onPlay}
                  type="button"
                >
                  XEM NGAY
                  <span className="ml-4 grid h-9 w-9 place-items-center rounded-full bg-[#1a1c23]/10 transition group-hover:bg-[#1a1c23]/20 sm:h-10 sm:w-10">
                    <Play fill="currentColor" size={16} />
                  </span>
                </button>
                <button 
                  className="flex h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-white/90 transition hover:bg-white/5 hover:text-white sm:h-12"
                  onClick={onOpenLibrary}
                  type="button"
                >
                  TẤT CẢ PHIM +
                </button>
              </div>
            </div>

            {/* Right side: Crew */}
            <div className="flex shrink-0 flex-col text-sm lg:w-[240px]">
              <div className="group flex cursor-pointer items-center justify-between py-3 transition hover:bg-white/5">
                <div>
                  <h3 className="text-[13px] font-medium text-[#7d8ba7]">Director</h3>
                  <p className="mt-1 text-white/90">meomeo</p>
                </div>
                <ArrowRight size={14} className="text-[#e2734a] opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="h-px w-full bg-white/5" />
              <div className="group flex cursor-pointer items-center justify-between py-3 transition hover:bg-white/5">
                <div>
                  <h3 className="text-[13px] font-medium text-[#7d8ba7]">Writers</h3>
                  <p className="mt-1 text-white/90">meomeo</p>
                </div>
                <ArrowRight size={14} className="text-[#e2734a] opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="h-px w-full bg-white/5" />
              <div className="group flex cursor-pointer items-center justify-between py-3 transition hover:bg-white/5">
                <div>
                  <h3 className="text-[13px] font-medium text-[#7d8ba7]">Stars</h3>
                  <p className="mt-1 text-white/90">gâu gâu</p>
                </div>
                <ArrowRight size={14} className="text-[#e2734a] opacity-0 transition group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

