import { Check, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "../../../components/ui/alert.jsx";
import { Button } from "../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";

export default function ManageMovieHeroDialog({ featuredMovie, movies, mutation }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const selectedMovie = useMemo(() => movies.find((movie) => movie.id === selectedId), [movies, selectedId]);

  useEffect(() => {
    if (!thumbnail) {
      setPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(thumbnail);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnail]);

  function handleOpenChange(value) {
    if (mutation.isPending) return;
    setOpen(value);
    if (value) {
      setSelectedId(featuredMovie?.id || movies[0]?.id || "");
      setThumbnail(null);
      setError("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedId || !thumbnail) return;
    setError("");
    try {
      await mutation.mutateAsync({ id: selectedId, thumbnail });
      setOpen(false);
      setThumbnail(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật hero");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="border-white/25 bg-black/55 text-white backdrop-blur-md hover:bg-black/75" type="button" variant="outline">
          <ImagePlus size={16} /> Quản lý hero
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#171717] text-white sm:max-w-3xl [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold">Quản lý phim nổi bật</DialogTitle>
          <DialogDescription className="text-white/55">Chọn phim và tải ảnh ngang riêng cho khu vực hero.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-white/75">Phim hiển thị trên hero</span>
            <select
              className="h-11 w-full rounded-md border border-white/15 bg-[#222] px-3 text-sm text-white outline-none focus:border-white/40"
              disabled={mutation.isPending}
              onChange={(event) => setSelectedId(event.target.value)}
              required
              value={selectedId}
            >
              <option disabled value="">Chọn phim</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>{movie.title}{movie.isPublished ? "" : " (draft)"}</option>
              ))}
            </select>
          </label>

          <div className="overflow-hidden rounded-md border border-white/10 bg-black">
            <div className="relative aspect-video">
              <img
                alt={selectedMovie ? `Preview hero ${selectedMovie.title}` : "Preview hero"}
                className="h-full w-full object-cover"
                src={previewUrl || selectedMovie?.backdrop || selectedMovie?.poster || ""}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent" />
              {selectedMovie ? (
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <p className="max-w-[14ch] text-2xl font-semibold leading-none sm:text-4xl">{selectedMovie.title}</p>
                  <p className="mt-2 text-xs text-white/55">{selectedMovie.year} · {selectedMovie.age}</p>
                </div>
              ) : null}
            </div>
          </div>

          <label className="block cursor-pointer rounded-md border border-dashed border-white/20 bg-white/[0.03] p-4 text-sm transition hover:bg-white/[0.06]">
            <span className="flex items-center gap-2 font-semibold"><UploadCloud size={18} /> Thumbnail hero (16:9)</span>
            <span className="mt-1 block text-xs leading-5 text-white/45">Khuyến nghị 1920×1080, JPG/PNG/WebP, tối đa 8 MB.</span>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="mt-3 block w-full text-xs text-white/60 file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-black"
              disabled={mutation.isPending}
              onChange={(event) => setThumbnail(event.target.files?.[0] || null)}
              required
              type="file"
            />
            {thumbnail ? <span className="mt-2 block truncate text-xs text-[#f3a38d]">{thumbnail.name}</span> : null}
          </label>

          {selectedMovie && !selectedMovie.isPublished ? <Alert className="border-amber-300/20 bg-amber-300/10 text-amber-100" variant="warning">Phim đang là draft. Admin vẫn thấy hero này, người dùng chỉ thấy sau khi phim được publish.</Alert> : null}
          {error ? <Alert className="border-red-300/20 bg-red-300/10 text-red-100" variant="error">{error}</Alert> : null}

          <div className="flex justify-end">
            <Button className="bg-[#e06f50] text-white hover:bg-[#c95f43]" disabled={!selectedId || !thumbnail || mutation.isPending} type="submit">
              {mutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
              {mutation.isPending ? "Đang cập nhật..." : "Đặt làm hero"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
