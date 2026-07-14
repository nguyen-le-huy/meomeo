import { ArrowLeft, Eye, EyeOff, FileUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { useCreateEbook, useDeleteEbook, useEbooks, usePublishEbook } from "../hooks/useEbooks.js";

const maxEbookFileSize = 150 * 1024 * 1024;
const maxCoverFileSize = 10 * 1024 * 1024;

function formatFileSize(size) {
  if (!size) return "0MB";
  return `${Math.round((size / 1024 / 1024) * 10) / 10}MB`;
}

export default function AdminEbooksPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [level, setLevel] = useState("");
  const [uploadError, setUploadError] = useState("");
  const { data: ebooks = [], isLoading } = useEbooks({ includeUnpublished: true });
  const create = useCreateEbook();
  const remove = useDeleteEbook();
  const publish = usePublishEbook();

  useEffect(() => {
    if (!cover) {
      setCoverPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setUploadError("");

    if (selectedFile && selectedFile.size > maxEbookFileSize) {
      setFile(null);
      event.target.value = "";
      setUploadError(`File ebook đang là ${formatFileSize(selectedFile.size)}. Giới hạn hiện tại là 150MB.`);
      return;
    }

    setFile(selectedFile);
  }

  function handleCoverChange(event) {
    const selectedCover = event.target.files?.[0] || null;
    setUploadError("");

    if (selectedCover && selectedCover.size > maxCoverFileSize) {
      setCover(null);
      event.target.value = "";
      setUploadError(`Ảnh bìa đang là ${formatFileSize(selectedCover.size)}. Giới hạn hiện tại là 10MB.`);
      return;
    }

    setCover(selectedCover);
  }

  async function submit(event) {
    event.preventDefault();
    setUploadError("");

    if (!file || !title.trim()) return;

    const form = new FormData();
    form.append("file", file);
    if (cover) form.append("cover", cover);
    form.append("title", title);
    form.append("description", description);
    form.append("author", author);
    form.append("level", level);

    try {
      await create.mutateAsync(form);
      setFile(null);
      setCover(null);
      setTitle("");
      setDescription("");
      setAuthor("");
      setLevel("");
      event.target.reset();
    } catch (error) {
      setUploadError(error?.response?.data?.message || "Không upload được ebook. Vui lòng thử lại.");
    }
  }

  return (
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Button onClick={() => navigate("/ebooks")} size="sm" type="button" variant="ghost">
          <ArrowLeft size={16} /> Thư viện ebook
        </Button>

        <div className="mt-5">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-normal">Quản lý ebook</h1>
        </div>

        <Card className="mt-8">
          <CardContent className="p-5">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <label className="grid gap-1 text-sm font-semibold">
                Tiêu đề
                <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Tác giả
                <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Trình độ
                <Input placeholder="A2, B1..." value={level} onChange={(event) => setLevel(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                File ebook
                <input accept=".epub,.pdf,application/epub+zip,application/pdf" className="h-10 rounded-md border px-3 py-2 text-sm" required type="file" onChange={handleFileChange} />
                <span className="text-xs font-medium text-ink-muted">EPUB/PDF, tối đa 150MB.</span>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Ảnh bìa
                <input accept="image/jpeg,image/png,image/webp" className="h-10 rounded-md border px-3 py-2 text-sm" type="file" onChange={handleCoverChange} />
                <span className="text-xs font-medium text-ink-muted">JPG/PNG/WebP, tối đa 10MB.</span>
                {coverPreview ? <img alt="Preview ảnh bìa" className="mt-2 h-28 w-20 rounded-md object-cover" src={coverPreview} /> : null}
              </label>
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                Mô tả
                <textarea className="min-h-20 rounded-md border bg-canvas px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              {uploadError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 md:col-span-2">{uploadError}</p> : null}
              <Button className="md:col-span-2 md:w-fit" disabled={create.isPending} type="submit">
                <FileUp size={16} /> {create.isPending ? "Đang upload..." : "Upload ebook"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-4">
          {isLoading ? <LoadingState label="Đang tải ebook..." /> : ebooks.map((ebook) => (
            <Card key={ebook._id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  {ebook.coverUrl ? <img alt={ebook.title} className="h-16 w-12 rounded object-cover" src={ebook.coverUrl} /> : null}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ebook.isPublished ? "success" : "secondary"}>{ebook.isPublished ? "Public" : "Ẩn"}</Badge>
                      <span className="text-xs font-semibold text-ink-muted">{ebook.format.toUpperCase()}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-bold">{ebook.title}</h2>
                    <p className="text-sm text-ink-muted">{ebook.author || "Chưa nhập tác giả"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate(`/ebooks/${ebook.slug}`)} size="sm" type="button" variant="outline">Xem</Button>
                  <Button disabled={publish.isPending} onClick={() => publish.mutate({ id: ebook._id, isPublished: !ebook.isPublished })} size="sm" type="button" variant="outline">
                    {ebook.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    {ebook.isPublished ? "Ẩn" : "Public"}
                  </Button>
                  <Button disabled={remove.isPending} onClick={() => window.confirm(`Xoá ebook "${ebook.title}"?`) && remove.mutate(ebook._id)} size="sm" type="button" variant="outline">
                    <Trash2 size={15} /> Xoá
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
