import { ArrowRight, Clock, Film, Plus, Play, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button.jsx";

const DEFAULT_POSITIONS = [
  { top: "-40px", right: "-30px", size: "270px" },
  { bottom: "-40px", left: "-30px", size: "280px" },
  { top: "25%", right: "-50px", size: "290px" },
  { top: "-50px", left: "220px", size: "260px" },
  { bottom: "10px", right: "60px", size: "270px" },
];

export default function LatestMovieFeatureCard({ movie, onOpenLibrary, onPlay }) {
  const [stickers, setStickers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const storageKey = movie ? `movie_stickers_${movie.id || movie._id || 'featured'}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setStickers(JSON.parse(saved));
      } else {
        setStickers([]);
      }
    } catch {
      setStickers([]);
    }
  }, [storageKey]);

  function saveStickers(newStickers) {
    setStickers(newStickers);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newStickers));
    }
  }

  function handleAddSticker(e) {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;

    const pos = DEFAULT_POSITIONS[stickers.length % DEFAULT_POSITIONS.length];
    const newSticker = {
      id: Date.now().toString(),
      url,
      top: pos.top,
      right: pos.right,
      bottom: pos.bottom,
      left: pos.left,
      size: pos.size,
    };

    saveStickers([...stickers, newSticker]);
    setInputUrl("");
    setIsDialogOpen(false);
  }

  function handleRemoveSticker(idToRemove) {
    saveStickers(stickers.filter((s) => s.id !== idToRemove));
  }

  if (!movie) return null;

  return (
    <section aria-labelledby="latest-movie-title" className="relative border-b border-[#e6dfd8] py-8 sm:py-10">
      <article className="relative flex flex-col rounded-2xl bg-[#13141a] text-white shadow-2xl sm:flex-row">
        
        {/* Render Floating Stickers */}
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className="group/sticker absolute z-30 pointer-events-auto transition duration-200 hover:scale-105"
            style={{
              top: sticker.top,
              right: sticker.right,
              bottom: sticker.bottom,
              left: sticker.left,
              width: sticker.size || "270px",
            }}
          >
            <img
              alt="Sticker"
              className="h-auto w-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
              src={sticker.url}
            />
            <button
              className="absolute -right-2 -top-2 hidden h-7 w-7 place-items-center rounded-full bg-red-600 text-xs font-bold text-white shadow-lg group-hover/sticker:grid"
              onClick={() => handleRemoveSticker(sticker.id)}
              title="Xóa sticker"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        ))}

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
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px]" id="latest-movie-title">
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
                <button
                  className="flex h-11 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 sm:h-12"
                  onClick={() => setIsDialogOpen(true)}
                  type="button"
                >
                  <Sparkles size={16} /> + Thêm Sticker
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

      {/* Add Sticker Dialog / Popup */}
      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[#1b1c24] p-6 text-white shadow-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="flex items-center gap-2 font-semibold text-lg">
                <Sparkles className="text-amber-400" size={18} /> Thêm Sticker Giphy
              </h3>
              <button
                className="text-white/50 hover:text-white"
                onClick={() => setIsDialogOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            
            <form className="mt-4 flex flex-col gap-4" onSubmit={handleAddSticker}>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  Đường dẫn Sticker (Giphy GIF URL / Image URL):
                </label>
                <input
                  autoFocus
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400"
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://media.giphy.com/media/.../giphy.gif"
                  value={inputUrl}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => setIsDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Hủy
                </Button>
                <Button className="bg-amber-400 font-bold text-black hover:bg-amber-300" type="submit">
                  <Plus size={16} /> Thêm Sticker
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
