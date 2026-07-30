import { Captions, Film, UploadCloud } from "lucide-react";
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
import { uploadMovieFile } from "../utils/tusMovieUpload.js";
import { getMovieVideoMimeType, MOVIE_VIDEO_ACCEPT } from "../utils/movieVideoFile.js";

const initialForm = {
  title: "",
  description: "",
  releaseYear: new Date().getFullYear(),
  ageRating: "13+",
  level: "A2",
  rating: 0,
  subtitleSource: "external",
};

export default function AddMovieDialog({ createMutation, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [subtitle, setSubtitle] = useState(null);
  const [viSubtitle, setViSubtitle] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    if (!poster) {
      setPosterPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(poster);
    setPosterPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [poster]);

  async function submit(event) {
    event.preventDefault();
    setUploadError("");
    setProgress(0);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, String(value)));
      formData.append("uploadFileName", file.name);
      formData.append("uploadFileSize", String(file.size));
      formData.append("uploadFileLastModified", String(file.lastModified || 0));
      formData.append("uploadFileType", getMovieVideoMimeType(file));
      formData.append("poster", poster);
      if (subtitle) formData.append("subtitle", subtitle);
      if (viSubtitle) formData.append("viSubtitle", viSubtitle);
      const response = await createMutation.mutateAsync(formData);
      const data = response.data.data;
      setIsUploading(true);
      await uploadMovieFile({
        credentials: data.upload,
        file,
        movieId: data.movie._id,
        onProgress: setProgress,
        title: form.title,
      });
      setForm(initialForm);
      setFile(null);
      setPoster(null);
      setSubtitle(null);
      setViSubtitle(null);
      setOpen(false);
      onCreated?.(data.movie);
    } catch (error) {
      setUploadError(error.response?.data?.message || error.message || "Không thể upload phim");
    } finally {
      setIsUploading(false);
    }
  }

  const busy = createMutation.isPending || isUploading;
  const isMkv = /\.mkv$/i.test(file?.name || "");
  const needsExternalSubtitle = form.subtitleSource === "external";

  return (
    <Dialog onOpenChange={(value) => !busy && setOpen(value)} open={open}>
      <DialogTrigger asChild>
        <Button className="border-white/20 bg-white text-black hover:bg-white/85" type="button"><Film size={16} /> Thêm phim</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-[#171717] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm phim lên Bunny Stream</DialogTitle>
          <DialogDescription className="text-white/55">Tạo draft và upload trực tiếp từ trình duyệt. API key không được gửi xuống frontend.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm"><span className="mb-1 block text-white/65">Tên phim</span><Input className="border-white/15 bg-white/5 text-white" onChange={(event) => updateField("title", event.target.value)} required value={form.title} /></label>
          <label className="block text-sm"><span className="mb-1 block text-white/65">Mô tả</span><Textarea className="border-white/15 bg-white/5 text-white" onChange={(event) => updateField("description", event.target.value)} value={form.description} /></label>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <label className="rounded-md border border-dashed border-white/20 bg-white/[0.03] p-3 text-sm">
              <span className="mb-2 block font-semibold">Ảnh poster (2:3)</span>
              <span className="mb-3 grid aspect-[2/3] max-h-72 w-full place-items-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                {posterPreview ? (
                  <img
                    alt={`Xem trước ảnh bìa ${form.title || "phim"}`}
                    className="h-full w-full object-contain"
                    src={posterPreview}
                  />
                ) : (
                  <span className="px-3 text-center text-xs text-white/35">Ảnh bìa sẽ hiển thị tại đây</span>
                )}
              </span>
              <input accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setPoster(event.target.files?.[0] || null)} required type="file" />
              {poster ? <span className="mt-2 block truncate text-xs text-white/45">{poster.name}</span> : null}
            </label>
            <div className="space-y-3">
              <fieldset className="rounded-md border border-white/15 bg-white/[0.03] p-3">
                <legend className="px-1 text-sm font-semibold">Nguồn phụ đề</legend>
                <label className="mt-1 flex cursor-pointer items-start gap-2.5 rounded-md p-2 text-sm hover:bg-white/5">
                  <input
                    checked={form.subtitleSource === "external"}
                    className="mt-1 accent-[#e06f50]"
                    disabled={busy}
                    name="subtitleSource"
                    onChange={() => updateField("subtitleSource", "external")}
                    type="radio"
                  />
                  <span><strong className="block">Tự tải file phụ đề</strong><span className="text-xs text-white/45">Hỗ trợ SRT, VTT và SAMI (.smi); bỏ qua caption nhúng.</span></span>
                </label>
                <label className={`flex items-start gap-2.5 rounded-md p-2 text-sm ${isMkv ? "cursor-pointer hover:bg-white/5" : "cursor-not-allowed opacity-45"}`}>
                  <input
                    checked={form.subtitleSource === "embedded"}
                    className="mt-1 accent-[#e06f50]"
                    disabled={busy || !isMkv}
                    name="subtitleSource"
                    onChange={() => {
                      updateField("subtitleSource", "embedded");
                      setSubtitle(null);
                      setViSubtitle(null);
                    }}
                    type="radio"
                  />
                  <span>
                    <strong className="block">Dùng phụ đề nhúng trong MKV</strong>
                    <span className="text-xs text-white/45">
                      Bunny Player dùng caption nếu nhận diện được. Muốn xuất bản bài học vẫn cần import transcript English.
                    </span>
                  </span>
                </label>
              </fieldset>
              {needsExternalSubtitle ? <label className="block rounded-md border border-dashed border-white/20 bg-white/[0.03] p-3 text-sm">
                <span className="mb-2 flex items-center gap-2 font-semibold"><Captions size={16} /> Phụ đề English</span>
                <input accept=".srt,.vtt,.smi,.sami,application/x-subrip,text/vtt,application/smil,text/plain" disabled={busy} onChange={(event) => setSubtitle(event.target.files?.[0] || null)} required type="file" />
                {subtitle ? <span className="mt-2 block truncate text-xs text-white/45">{subtitle.name}</span> : null}
              </label> : null}
              {needsExternalSubtitle ? (
                <label className="block rounded-md border border-dashed border-white/20 bg-white/[0.03] p-3 text-sm">
                  <span className="mb-2 block font-semibold">Phụ đề Việt <span className="font-normal text-white/40">— không bắt buộc</span></span>
                  <input accept=".srt,.vtt,.smi,.sami,application/x-subrip,text/vtt,application/smil,text/plain" disabled={busy} onChange={(event) => setViSubtitle(event.target.files?.[0] || null)} type="file" />
                  {viSubtitle ? <span className="mt-2 block truncate text-xs text-white/45">{viSubtitle.name}</span> : null}
                </label>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm"><span className="mb-1 block text-white/65">Năm</span><Input className="border-white/15 bg-white/5 text-white" max="2200" min="1888" onChange={(event) => updateField("releaseYear", event.target.value)} type="number" value={form.releaseYear} /></label>
            <label className="text-sm"><span className="mb-1 block text-white/65">Độ tuổi</span><Input className="border-white/15 bg-white/5 text-white" onChange={(event) => updateField("ageRating", event.target.value)} value={form.ageRating} /></label>
            <label className="text-sm"><span className="mb-1 block text-white/65">Level</span><select className="h-10 w-full rounded-lg border border-white/15 bg-[#222] px-3 text-sm" onChange={(event) => updateField("level", event.target.value)} value={form.level}>{["A1", "A2", "B1", "B2", "C1"].map((level) => <option key={level}>{level}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-white/65">Điểm</span><Input className="border-white/15 bg-white/5 text-white" max="10" min="0" onChange={(event) => updateField("rating", event.target.value)} step="0.1" type="number" value={form.rating} /></label>
          </div>
          <label className="block rounded-md border border-dashed border-white/20 bg-white/[0.03] p-4 text-sm">
            <span className="mb-2 flex items-center gap-2 font-semibold"><UploadCloud size={18} /> File video</span>
            <input
              accept={MOVIE_VIDEO_ACCEPT}
              disabled={busy}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setFile(nextFile);
                if (!/\.mkv$/i.test(nextFile?.name || "") && form.subtitleSource === "embedded") {
                  updateField("subtitleSource", "external");
                }
              }}
              required
              type="file"
            />
            {file ? <span className="mt-2 block text-xs text-white/45">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span> : null}
          </label>
          {progress > 0 ? <div><div className="mb-1 flex justify-between text-xs text-white/55"><span>Đang upload</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-[#e06f50] transition-all" style={{ width: `${progress}%` }} /></div></div> : null}
          {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}
          <Button className="w-full bg-[#e06f50] text-white hover:bg-[#c95f43]" disabled={busy || !file || !poster || (needsExternalSubtitle && !subtitle)} type="submit">{busy ? `Đang xử lý ${progress || 0}%` : "Tạo draft và upload"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
