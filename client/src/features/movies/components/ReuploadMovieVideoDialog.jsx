import { CheckCircle2, RefreshCw, UploadCloud, Video } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../../components/ui/alert.jsx";
import { Button } from "../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";
import { uploadMovieFile } from "../utils/tusMovieUpload.js";

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export default function ReuploadMovieVideoDialog({ movie, onOpenChange, open, onSuccess }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function handleOpenChange(value) {
    if (isUploading) return;
    onOpenChange?.(value);
    if (!value) {
      setFile(null);
      setProgress(0);
      setBytesUploaded(0);
      setUploadError("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!file || !movie) return;

    setUploadError("");
    setProgress(0);
    setBytesUploaded(0);
    setIsUploading(true);

    try {
      const movieId = movie.id || movie._id;
      await uploadMovieFile({
        file,
        isReupload: true,
        movieId,
        onProgress: (p, currentUploaded) => {
          setProgress(p);
          setBytesUploaded(currentUploaded);
        },
        title: movie.title,
      });

      setFile(null);
      onOpenChange?.(false);
      onSuccess?.();
    } catch (error) {
      setUploadError(error.message || "Không thể upload lại video phim");
    } finally {
      setIsUploading(false);
    }
  }

  if (!movie) return null;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#171717] text-white sm:max-w-lg [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-sans text-xl font-semibold">
            <UploadCloud className="text-[#e06f50]" size={22} /> Upload lại video phim
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Thay thế file video nguồn cho phim <strong className="text-white">{movie.title}</strong> bằng file chất lượng cao hơn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-[#e06f50]/30 bg-[#e06f50]/10 p-3 text-xs text-[#ffd8c9]">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0 text-[#e06f50]" size={15} />
            <span><strong>Giữ nguyên phụ đề:</strong> Tất cả câu tiếng Anh & Vietsub đã dịch/import được bảo toàn 100%.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0 text-[#e06f50]" size={15} />
            <span><strong>Giữ nguyên tiến trình:</strong> Lịch sử học, vị trí xem dở của người dùng không bị ảnh hưởng.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0 text-[#e06f50]" size={15} />
            <span><strong>Tự động dọn dẹp:</strong> Video cũ trên Bunny Stream sẽ tự động được xóa sau khi video mới encode xong.</span>
          </div>
        </div>

        <form className="space-y-4 pt-2" onSubmit={submit}>
          <label className="block rounded-lg border border-dashed border-white/20 bg-white/[0.03] p-4 text-sm transition hover:bg-white/[0.06]">
            <span className="mb-2 flex items-center gap-2 font-semibold text-white/90">
              <Video size={18} /> Chọn file video mới (.mp4, .mkv, .webm)
            </span>
            <input
              accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
              disabled={isUploading}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
              type="file"
            />
            {file ? (
              <div className="mt-3 flex items-center justify-between rounded bg-white/10 px-3 py-2 text-xs">
                <span className="truncate font-medium text-white">{file.name}</span>
                <span className="ml-2 shrink-0 font-bold text-white/70">{formatBytes(file.size)}</span>
              </div>
            ) : null}
          </label>

          {isUploading || progress > 0 ? (
            <div className="space-y-1.5 rounded-lg bg-black/40 p-3">
              <div className="flex justify-between text-xs font-medium text-white/80">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="animate-spin text-[#e06f50]" size={14} />
                  {progress < 100 ? "Đang upload video..." : "Hoàn tất upload, đang chờ xử lý..."}
                </span>
                <span>{formatBytes(bytesUploaded)} / {formatBytes(file?.size)} ({progress}%)</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-[#e06f50] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {uploadError ? <Alert variant="error">{uploadError}</Alert> : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="border-white/15 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
              disabled={isUploading}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              className="bg-[#e06f50] text-white hover:bg-[#c95f43]"
              disabled={isUploading || !file}
              type="submit"
            >
              {isUploading ? `Đang upload ${progress}%` : "Xác nhận & Upload video mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
