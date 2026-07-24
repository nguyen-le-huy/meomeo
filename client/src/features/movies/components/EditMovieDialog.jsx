import { Check, ImagePlus, LoaderCircle, Pencil, Star, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "../../../components/ui/input.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import ReuploadMovieVideoDialog from "./ReuploadMovieVideoDialog.jsx";

function createForm(movie) {
  return {
    title: movie.title || "",
    description: movie.description || "",
    releaseYear: movie.releaseYear || movie.year || new Date().getFullYear(),
    ageRating: movie.ageRating || movie.age || "13+",
    level: movie.level || "A2",
    rating: Number(movie.rating || 0),
  };
}

export default function EditMovieDialog({ movie, mutation }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => createForm(movie));
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [error, setError] = useState("");
  const [showReuploadDialog, setShowReuploadDialog] = useState(false);

  useEffect(() => {
    if (!poster) {
      setPosterPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(poster);
    setPosterPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [poster]);

  function handleOpenChange(value) {
    if (mutation.isPending) return;
    setOpen(value);
    if (value) {
      setForm(createForm(movie));
      setPoster(null);
      setError("");
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, String(value)));
      if (poster) formData.append("poster", poster);
      await mutation.mutateAsync({ id: movie.id, data: formData });
      setOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật phim");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <button aria-label={`Chỉnh sửa ${movie.title}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded border border-white/15 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white" title="Chỉnh sửa phim" type="button">
          <Pencil size={14} /> Sửa
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#171717] text-white sm:max-w-2xl [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold">Chỉnh sửa phim</DialogTitle>
          <DialogDescription className="text-white/55">Cập nhật thông tin hiển thị, điểm đánh giá và poster.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <label className="group relative block aspect-[2/3] cursor-pointer overflow-hidden rounded-md border border-white/15 bg-black">
              <img alt={`Poster ${movie.title}`} className="h-full w-full object-cover" src={posterPreview || movie.poster} />
              <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100"><span className="inline-flex items-center gap-1.5 text-xs font-semibold"><ImagePlus size={16} /> Đổi poster</span></span>
              <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={mutation.isPending} onChange={(event) => setPoster(event.target.files?.[0] || null)} type="file" />
            </label>

            <div className="space-y-4">
              <label className="block text-sm"><span className="mb-1.5 block text-white/65">Tên phim</span><Input className="border-white/15 bg-white/5 text-white" disabled={mutation.isPending} onChange={(event) => updateField("title", event.target.value)} required value={form.title} /></label>
              <label className="block text-sm"><span className="mb-1.5 block text-white/65">Mô tả</span><Textarea className="min-h-28 border-white/15 bg-white/5 text-white" disabled={mutation.isPending} onChange={(event) => updateField("description", event.target.value)} value={form.description} /></label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm"><span className="mb-1.5 block text-white/65">Năm</span><Input className="border-white/15 bg-white/5 text-white" max="2200" min="1888" onChange={(event) => updateField("releaseYear", event.target.value)} required type="number" value={form.releaseYear} /></label>
            <label className="text-sm"><span className="mb-1.5 block text-white/65">Độ tuổi</span><Input className="border-white/15 bg-white/5 text-white" maxLength={12} onChange={(event) => updateField("ageRating", event.target.value)} value={form.ageRating} /></label>
            <label className="text-sm"><span className="mb-1.5 block text-white/65">Trình độ</span><select className="h-10 w-full rounded-lg border border-white/15 bg-[#222] px-3 text-sm" onChange={(event) => updateField("level", event.target.value)} value={form.level}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1.5 flex items-center gap-1 text-white/65"><Star size={13} /> Điểm</span><Input className="border-white/15 bg-white/5 text-white" max="10" min="0" onChange={(event) => updateField("rating", event.target.value)} required step="0.1" type="number" value={form.rating} /></label>
          </div>

          {poster ? <p className="truncate text-xs text-[#f3a38d]">Poster mới: {poster.name}</p> : null}
          {error ? <Alert className="border-red-300/20 bg-red-300/10 text-red-100" variant="error">{error}</Alert> : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded border border-white/20 bg-white/5 px-3 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setShowReuploadDialog(true)}
              type="button"
            >
              <UploadCloud size={15} /> Upload lại video mới
            </button>
            <Button className="bg-[#e06f50] text-white hover:bg-[#c95f43]" isLoading={mutation.isPending} type="submit">
              Lưu thay đổi
            </Button>
          </div>
        </form>

        {showReuploadDialog && (
          <ReuploadMovieVideoDialog
            movie={movie}
            onOpenChange={setShowReuploadDialog}
            open={showReuploadDialog}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
