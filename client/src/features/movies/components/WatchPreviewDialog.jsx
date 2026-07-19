import { Captions, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../../components/ui/dialog.jsx";

const subtitleModes = [
  { id: "bilingual", label: "Song ngữ" },
  { id: "english", label: "English" },
  { id: "vietnamese", label: "Tiếng Việt" },
  { id: "off", label: "Tắt" },
];

export default function WatchPreviewDialog({ movie, onOpenChange, open }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [subtitleMode, setSubtitleMode] = useState("bilingual");

  useEffect(() => {
    if (open) setIsPlaying(true);
  }, [open, movie?.id]);

  if (!movie) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-5xl gap-0 overflow-hidden rounded-lg border-white/10 bg-[#0d0d0c] p-0 text-white [&>button]:z-30 [&>button]:rounded-full [&>button]:bg-black/55 [&>button]:p-2 [&>button]:text-white">
        <DialogTitle className="sr-only">Xem thử {movie.title}</DialogTitle>
        <DialogDescription className="sr-only">Trình xem thử frontend với phụ đề song ngữ.</DialogDescription>

        <div className="relative aspect-video min-h-[230px] overflow-hidden bg-black">
          <img alt="" className={`h-full w-full object-cover transition duration-700 ${isPlaying ? "scale-105" : "scale-100"}`} src={movie.backdrop} />
          <div className="absolute inset-0 bg-black/20" />
          <button
            aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            className="absolute inset-0 grid h-full w-full place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e06f50]"
            onClick={() => setIsPlaying((current) => !current)}
            type="button"
          >
            {!isPlaying ? (
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/35 bg-black/50 backdrop-blur-sm">
                <Play fill="currentColor" size={27} />
              </span>
            ) : null}
          </button>

          {subtitleMode !== "off" ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-14 z-10 text-center sm:bottom-16">
              {subtitleMode !== "vietnamese" ? (
                <p className="mx-auto w-fit max-w-[92%] bg-black/70 px-2 py-1 text-sm font-semibold leading-snug text-white sm:text-xl">{movie.subtitle}</p>
              ) : null}
              {subtitleMode !== "english" ? (
                <p className="mx-auto mt-1 w-fit max-w-[92%] bg-black/70 px-2 py-1 text-xs leading-snug text-[#ffd8c9] sm:text-base">{movie.translation}</p>
              ) : null}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-20 bg-black/75 px-3 pb-3 pt-5 sm:px-5">
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full w-[37%] bg-[#e06f50]" />
            </div>
            <div className="flex items-center gap-3">
              <button aria-label={isPlaying ? "Tạm dừng" : "Phát"} onClick={() => setIsPlaying((current) => !current)} type="button">
                {isPlaying ? <Pause fill="currentColor" size={19} /> : <Play fill="currentColor" size={19} />}
              </button>
              <button aria-label="Phát lại 10 giây" type="button"><RotateCcw size={18} /></button>
              <button aria-label="Âm lượng" type="button"><Volume2 size={19} /></button>
              <span className="ml-auto text-xs text-white/60">24:18 / {movie.duration}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-bold uppercase text-[#e06f50]">Xem thử giao diện</p>
            <h2 className="mt-1 text-2xl font-bold">{movie.title}</h2>
            <p className="mt-1 text-sm text-white/50">{movie.vietnameseTitle} · {movie.year} · {movie.age}</p>
          </div>
          <div>
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55"><Captions size={15} /> Phụ đề</span>
            <div className="netflix-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-md bg-white/[0.06] p-1">
              {subtitleModes.map((mode) => (
                <button
                  className={`h-8 shrink-0 rounded px-3 text-xs font-semibold transition ${subtitleMode === mode.id ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                  key={mode.id}
                  onClick={() => setSubtitleMode(mode.id)}
                  type="button"
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
