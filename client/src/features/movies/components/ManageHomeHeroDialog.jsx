import { Check, LoaderCircle, Settings2 } from "lucide-react";
import { useState } from "react";
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

export default function ManageHomeHeroDialog({ featuredMovie, movies, mutation }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  function handleOpenChange(value) {
    if (mutation.isPending) return;
    setOpen(value);
    if (value) {
      setSelectedId(featuredMovie?._id || featuredMovie?.id || movies[0]?._id || movies[0]?.id || "");
      setError("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedId) return;
    setError("");
    try {
      await mutation.mutateAsync({ id: selectedId });
      setOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật phim nổi bật trang chủ");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button className="border-white/25 bg-black/55 text-white backdrop-blur-md hover:bg-black/75" type="button" variant="outline">
          <Settings2 size={16} /> Đổi phim nổi bật
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-white/10 bg-[#171717] text-white sm:max-w-lg [&>button]:text-white">
        <DialogHeader>
          <DialogTitle className="font-sans text-xl font-semibold">Phim nổi bật trang chủ</DialogTitle>
          <DialogDescription className="text-white/55">Chọn phim hiển thị ở phần hero của trang chủ.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-white/75">Chọn phim</span>
            <select
              className="h-11 w-full rounded-md border border-white/15 bg-[#222] px-3 text-sm text-white outline-none focus:border-white/40"
              disabled={mutation.isPending}
              onChange={(event) => setSelectedId(event.target.value)}
              required
              value={selectedId}
            >
              <option disabled value="">Chọn phim</option>
              {movies.map((movie) => (
                <option key={movie._id || movie.id} value={movie._id || movie.id}>{movie.title}{movie.isPublished ? "" : " (draft)"}</option>
              ))}
            </select>
          </label>

          {error ? <Alert className="border-red-300/20 bg-red-300/10 text-red-100" variant="error">{error}</Alert> : null}

          <div className="flex justify-end">
            <Button className="bg-[#e06f50] text-white hover:bg-[#c95f43]" disabled={!selectedId || mutation.isPending} type="submit">
              {mutation.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
              {mutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
