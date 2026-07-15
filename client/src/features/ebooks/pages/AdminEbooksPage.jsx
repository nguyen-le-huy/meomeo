import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  HardDrive,
  ImagePlus,
  Library,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import { Pagination } from "../../../components/ui/pagination.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { useCreateEbook, useDeleteEbook, useEbooks, usePublishEbook, useUpdateEbook } from "../hooks/useEbooks.js";

const maxEbookFileSize = 150 * 1024 * 1024;
const maxCoverFileSize = 10 * 1024 * 1024;
const pageSize = 9;

function formatFileSize(size) {
  if (!size) return "0 MB";
  return `${Math.round((size / 1024 / 1024) * 10) / 10} MB`;
}

function buildEditState(ebook) {
  return {
    title: ebook?.title || "",
    slug: ebook?.slug || "",
    description: ebook?.description || "",
    author: ebook?.author || "",
    level: ebook?.level || "",
    language: ebook?.language || "English",
    isPublished: Boolean(ebook?.isPublished),
    removeCover: false,
  };
}

function Field({ children, className = "", hint, label }) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-sm font-semibold ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal leading-5 text-ink-muted">{hint}</span> : null}
    </label>
  );
}

function Cover({ ebook, className = "" }) {
  if (ebook?.coverUrl) {
    return <img alt={ebook.title} className={`bg-cream-soft object-cover ${className}`} src={ebook.coverUrl} />;
  }

  return (
    <div className={`flex items-center justify-center bg-cream-soft text-ink-muted ${className}`}>
      <BookOpen aria-hidden="true" size={24} strokeWidth={1.5} />
    </div>
  );
}

function FileDropField({ accept, file, icon: Icon, inputRef, label, onChange, type }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <button
        className="group flex min-h-36 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#cfc6bb] bg-cream-soft/45 px-4 py-5 text-center transition hover:border-coral hover:bg-cream-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/30"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-coral shadow-sm ring-1 ring-[#e6dfd8] transition group-hover:-translate-y-0.5">
          <Icon aria-hidden="true" size={19} />
        </span>
        <span className="mt-3 max-w-full truncate text-sm font-semibold">{file?.name || `Chọn ${type}`}</span>
        <span className="mt-1 text-xs text-ink-muted">
          {file ? formatFileSize(file.size) : type === "file ebook" ? "EPUB hoặc PDF, tối đa 150 MB" : "JPG, PNG hoặc WebP, tối đa 10 MB"}
        </span>
      </button>
      <input ref={inputRef} accept={accept} className="sr-only" type="file" onChange={onChange} />
    </div>
  );
}

function CreateEbookDialog({ createMutation, onOpenChange, open }) {
  const ebookInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [level, setLevel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cover) {
      setCoverPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  function resetForm() {
    setFile(null);
    setCover(null);
    setTitle("");
    setDescription("");
    setAuthor("");
    setLevel("");
    setError("");
    if (ebookInputRef.current) ebookInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen && !createMutation.isPending) resetForm();
    onOpenChange(nextOpen);
  }

  function selectEbook(event) {
    const selectedFile = event.target.files?.[0] || null;
    setError("");
    if (selectedFile && selectedFile.size > maxEbookFileSize) {
      event.target.value = "";
      setFile(null);
      setError(`File ebook đang là ${formatFileSize(selectedFile.size)}. Giới hạn hiện tại là 150 MB.`);
      return;
    }
    setFile(selectedFile);
  }

  function selectCover(event) {
    const selectedCover = event.target.files?.[0] || null;
    setError("");
    if (selectedCover && selectedCover.size > maxCoverFileSize) {
      event.target.value = "";
      setCover(null);
      setError(`Ảnh bìa đang là ${formatFileSize(selectedCover.size)}. Giới hạn hiện tại là 10 MB.`);
      return;
    }
    setCover(selectedCover);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!file || !title.trim()) return;

    const data = new FormData();
    data.append("file", file);
    if (cover) data.append("cover", cover);
    data.append("title", title.trim());
    data.append("description", description);
    data.append("author", author);
    data.append("level", level);

    try {
      await createMutation.mutateAsync(data);
      resetForm();
      onOpenChange(false);
    } catch (mutationError) {
      setError(mutationError?.response?.data?.message || "Không upload được ebook. Vui lòng thử lại.");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[94vh] overflow-y-auto p-0 sm:max-w-4xl">
        <div className="border-b border-[#e6dfd8] px-5 py-5 sm:px-6">
          <DialogHeader>
            <DialogTitle>Thêm ebook mới</DialogTitle>
            <DialogDescription>File sách được lưu trên R2, ảnh bìa tiếp tục lưu tại kho ảnh hiện tại.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit}>
          <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1fr_1fr]">
            <div className="grid content-start gap-4">
              <Field label="Tiêu đề">
                <Input autoFocus placeholder="Ví dụ: The Song of Achilles" required value={title} onChange={(event) => setTitle(event.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tác giả">
                  <Input placeholder="Tên tác giả" value={author} onChange={(event) => setAuthor(event.target.value)} />
                </Field>
                <Field label="Trình độ">
                  <Input placeholder="A2, B1, B2..." value={level} onChange={(event) => setLevel(event.target.value)} />
                </Field>
              </div>
              <Field label="Mô tả">
                <Textarea className="min-h-28 resize-y" placeholder="Mô tả ngắn về nội dung cuốn sách" value={description} onChange={(event) => setDescription(event.target.value)} />
              </Field>
            </div>

            <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <FileDropField
                accept=".epub,.pdf,application/epub+zip,application/pdf"
                file={file}
                icon={UploadCloud}
                inputRef={ebookInputRef}
                label="File ebook *"
                onChange={selectEbook}
                type="file ebook"
              />
              <div className="relative">
                <FileDropField
                  accept="image/jpeg,image/png,image/webp"
                  file={cover}
                  icon={ImagePlus}
                  inputRef={coverInputRef}
                  label="Ảnh bìa"
                  onChange={selectCover}
                  type="ảnh bìa"
                />
                {coverPreview ? <img alt="Xem trước ảnh bìa" className="pointer-events-none absolute bottom-3 right-3 h-20 w-14 rounded object-cover shadow-md ring-2 ring-canvas" src={coverPreview} /> : null}
              </div>
            </div>
          </div>

          {error ? <p className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 sm:mx-6">{error}</p> : null}
          <div className="flex items-center justify-end gap-2 border-t border-[#e6dfd8] bg-cream-soft/45 px-5 py-4 sm:px-6">
            <Button disabled={createMutation.isPending} onClick={() => handleOpenChange(false)} type="button" variant="outline">Huỷ</Button>
            <Button disabled={createMutation.isPending || !file || !title.trim()} type="submit">
              <FileUp size={16} /> {createMutation.isPending ? "Đang tải lên..." : "Thêm ebook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EbookEditDialog({ ebook, onOpenChange, updateMutation }) {
  const coverInputRef = useRef(null);
  const [form, setForm] = useState(() => buildEditState(ebook));
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildEditState(ebook));
    setCover(null);
    setCoverPreview("");
    setError("");
  }, [ebook]);

  useEffect(() => {
    if (!cover) {
      setCoverPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCoverChange(event) {
    const selectedCover = event.target.files?.[0] || null;
    setError("");
    if (selectedCover && selectedCover.size > maxCoverFileSize) {
      setCover(null);
      event.target.value = "";
      setError(`Ảnh bìa đang là ${formatFileSize(selectedCover.size)}. Giới hạn hiện tại là 10 MB.`);
      return;
    }
    setCover(selectedCover);
    if (selectedCover) updateField("removeCover", false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!ebook?._id) return;
    setError("");

    const data = new FormData();
    Object.entries({
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description,
      author: form.author,
      level: form.level,
      language: form.language,
      isPublished: String(form.isPublished),
    }).forEach(([key, value]) => data.append(key, value));
    if (form.removeCover) data.append("removeCover", "true");
    if (cover) data.append("cover", cover);

    try {
      await updateMutation.mutateAsync({ id: ebook._id, data });
      onOpenChange(false);
    } catch (mutationError) {
      setError(mutationError?.response?.data?.message || "Không lưu được thay đổi ebook.");
    }
  }

  const visibleCover = coverPreview || (!form.removeCover && ebook?.coverUrl);

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(ebook)}>
      <DialogContent className="max-h-[94vh] overflow-y-auto p-0 sm:max-w-4xl">
        <div className="border-b border-[#e6dfd8] px-5 py-5 sm:px-6">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa ebook</DialogTitle>
            <DialogDescription>Cập nhật thông tin và trạng thái hiển thị. File EPUB/PDF hiện tại sẽ được giữ nguyên.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit}>
          <div className="grid gap-6 px-5 py-6 sm:px-6 md:grid-cols-[180px_1fr]">
            <div>
              <button className="group relative block aspect-[2/3] w-full overflow-hidden rounded-lg border border-[#e6dfd8] bg-cream-soft" onClick={() => coverInputRef.current?.click()} type="button">
                {visibleCover ? <img alt="Ảnh bìa ebook" className="h-full w-full object-cover" src={visibleCover} /> : <BookOpen className="mx-auto text-ink-muted" size={34} strokeWidth={1.5} />}
                <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-md bg-coal/85 px-2 py-2 text-xs font-semibold text-white opacity-100 backdrop-blur-sm transition md:opacity-0 md:group-hover:opacity-100">
                  <ImagePlus size={14} /> Đổi ảnh bìa
                </span>
              </button>
              <input ref={coverInputRef} accept="image/jpeg,image/png,image/webp" className="sr-only" type="file" onChange={handleCoverChange} />
              {ebook?.coverUrl ? (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-muted">
                  <input checked={form.removeCover} className="h-4 w-4 accent-coral" type="checkbox" onChange={(event) => updateField("removeCover", event.target.checked)} />
                  Xoá ảnh bìa hiện tại
                </label>
              ) : null}
            </div>

            <div className="grid content-start gap-4">
              <Field label="Tiêu đề">
                <Input required value={form.title} onChange={(event) => updateField("title", event.target.value)} />
              </Field>
              <Field hint="Dùng trong đường dẫn của trang đọc." label="Slug">
                <Input required value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tác giả">
                  <Input value={form.author} onChange={(event) => updateField("author", event.target.value)} />
                </Field>
                <Field label="Trình độ">
                  <Input placeholder="A2, B1..." value={form.level} onChange={(event) => updateField("level", event.target.value)} />
                </Field>
                <Field label="Ngôn ngữ">
                  <Input value={form.language} onChange={(event) => updateField("language", event.target.value)} />
                </Field>
              </div>
              <Field label="Mô tả">
                <Textarea className="min-h-24 resize-y" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
              </Field>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[#e6dfd8] bg-cream-soft/45 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold">Hiển thị trong thư viện</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">Người đọc có thể tìm thấy và mở ebook này.</span>
                </span>
                <input checked={form.isPublished} className="h-5 w-5 accent-coral" type="checkbox" onChange={(event) => updateField("isPublished", event.target.checked)} />
              </label>
            </div>
          </div>

          {error ? <p className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 sm:mx-6">{error}</p> : null}
          <div className="flex items-center justify-end gap-2 border-t border-[#e6dfd8] bg-cream-soft/45 px-5 py-4 sm:px-6">
            <Button disabled={updateMutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">Huỷ</Button>
            <Button disabled={updateMutation.isPending || !form.title.trim() || !form.slug.trim()} type="submit">
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEbookDialog({ ebook, onOpenChange, removeMutation }) {
  async function confirmDelete() {
    if (!ebook?._id) return;
    try {
      await removeMutation.mutateAsync(ebook._id);
      onOpenChange(false);
    } catch {
      // Mutation state keeps the dialog open so the user can retry.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(ebook)}>
      <DialogContent className="sm:max-w-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={20} />
        </div>
        <DialogHeader>
          <DialogTitle>Xoá ebook?</DialogTitle>
          <DialogDescription>
            “{ebook?.title}” sẽ bị xoá khỏi thư viện cùng file sách và dữ liệu liên quan. Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        {removeMutation.isError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Không xoá được ebook. Vui lòng thử lại.</p> : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button disabled={removeMutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">Huỷ</Button>
          <Button disabled={removeMutation.isPending} onClick={confirmDelete} type="button" variant="destructive">
            <Trash2 size={15} /> {removeMutation.isPending ? "Đang xoá..." : "Xoá ebook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EbookActions({ ebook, navigate, onDelete, onEdit, publishMutation }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button aria-label={`Mở ${ebook.title}`} onClick={() => navigate(`/ebooks/${ebook.slug}`)} size="icon" title="Mở ebook" type="button" variant="ghost">
        <Eye size={16} />
      </Button>
      <Button aria-label={`Sửa ${ebook.title}`} onClick={() => onEdit(ebook)} size="icon" title="Chỉnh sửa" type="button" variant="ghost">
        <Edit3 size={16} />
      </Button>
      <Button
        aria-label={ebook.isPublished ? `Ẩn ${ebook.title}` : `Công khai ${ebook.title}`}
        disabled={publishMutation.isPending}
        onClick={() => publishMutation.mutate({ id: ebook._id, isPublished: !ebook.isPublished })}
        size="icon"
        title={ebook.isPublished ? "Ẩn khỏi thư viện" : "Công khai"}
        type="button"
        variant="ghost"
      >
        {ebook.isPublished ? <EyeOff size={16} /> : <CheckCircle2 size={16} />}
      </Button>
      <Button aria-label={`Xoá ${ebook.title}`} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(ebook)} size="icon" title="Xoá" type="button" variant="ghost">
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export default function AdminEbooksPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState(null);
  const [deletingEbook, setDeletingEbook] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const listTopRef = useRef(null);
  const { data: ebooks = [], isLoading, isError, error } = useEbooks({ includeUnpublished: true });
  const create = useCreateEbook();
  const update = useUpdateEbook();
  const remove = useDeleteEbook();
  const publish = usePublishEbook();

  const stats = useMemo(() => ({
    total: ebooks.length,
    published: ebooks.filter((ebook) => ebook.isPublished).length,
    draft: ebooks.filter((ebook) => !ebook.isPublished).length,
    r2: ebooks.filter((ebook) => ebook.fileStorageProvider === "r2").length,
  }), [ebooks]);

  const filteredEbooks = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return ebooks.filter((ebook) => {
      if (status === "published" && !ebook.isPublished) return false;
      if (status === "hidden" && ebook.isPublished) return false;
      if (!keyword) return true;
      return [ebook.title, ebook.author, ebook.slug, ebook.level, ebook.format]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(keyword));
    });
  }, [ebooks, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredEbooks.length / pageSize));
  const visibleEbooks = filteredEbooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  function changePage(page) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    requestAnimationFrame(() => listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const filters = [
    { id: "all", label: "Tất cả", count: stats.total },
    { id: "published", label: "Đang hiển thị", count: stats.published },
    { id: "hidden", label: "Đang ẩn", count: stats.draft },
  ];

  return (
    <section className="min-h-full bg-canvas px-4 py-7 text-coal sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Button onClick={() => navigate("/ebooks")} size="sm" type="button" variant="ghost">
          <ArrowLeft size={16} /> Thư viện ebook
        </Button>

        <header className="mt-5 flex flex-col gap-5 border-b border-[#e6dfd8] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Thư viện · Admin</p>
            <h1 className="mt-2 font-display text-4xl font-normal tracking-tight sm:text-5xl">Quản lý ebook</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Thêm sách, cập nhật thông tin và kiểm soát nội dung đang hiển thị trong thư viện.</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)} size="lg" type="button">
            <Plus size={18} /> Thêm ebook
          </Button>
        </header>

        <div className="grid border-b border-[#e6dfd8] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Library, label: "Tổng ebook", value: stats.total },
            { icon: Eye, label: "Đang hiển thị", value: stats.published },
            { icon: EyeOff, label: "Đang ẩn", value: stats.draft },
            { icon: HardDrive, label: "Lưu trên R2", value: stats.r2 },
          ].map((item, index) => (
            <div className={`flex items-center gap-3 py-5 ${index % 2 ? "sm:border-l sm:pl-6" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l lg:pl-6" : ""} border-[#e6dfd8]`} key={item.label}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-coral"><item.icon size={18} /></span>
              <div>
                <p className="text-2xl font-bold leading-none">{item.value}</p>
                <p className="mt-1 text-xs font-semibold text-ink-muted">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg bg-cream-soft p-1">
            {filters.map((filter) => (
              <button
                className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${status === filter.id ? "bg-canvas text-coal shadow-sm" : "text-ink-muted hover:text-coal"}`}
                key={filter.id}
                onClick={() => {
                  setStatus(filter.id);
                  setCurrentPage(1);
                }}
                type="button"
              >
                {filter.label}
                <span className="text-xs font-bold text-ink-muted">{filter.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <Input className="pl-9" placeholder="Tìm theo tên sách, tác giả, slug..." value={search} onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }} />
          </div>
        </div>

        <div className="scroll-mt-24" ref={listTopRef} />

        {isLoading ? <LoadingState className="mt-10" label="Đang tải ebook..." /> : null}
        {isError ? <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error?.response?.data?.message || "Không tải được danh sách ebook."}</p> : null}

        {!isLoading && !isError && filteredEbooks.length ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-[#e6dfd8] bg-canvas">
            <div className="hidden grid-cols-[minmax(320px,1fr)_130px_130px_110px_150px] items-center gap-4 border-b border-[#e6dfd8] bg-cream-soft/55 px-5 py-3 text-xs font-bold uppercase text-ink-muted lg:grid">
              <span>Ebook</span><span>Định dạng</span><span>Lưu trữ</span><span>Trạng thái</span><span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-[#e6dfd8]">
              {visibleEbooks.map((ebook) => (
                <article className="grid gap-4 px-4 py-4 transition hover:bg-cream-soft/30 lg:grid-cols-[minmax(320px,1fr)_130px_130px_110px_150px] lg:items-center lg:px-5" key={ebook._id}>
                  <button className="flex min-w-0 items-center gap-4 text-left" onClick={() => navigate(`/ebooks/${ebook.slug}`)} type="button">
                    <Cover className="h-[76px] w-[52px] shrink-0 rounded-md ring-1 ring-[#e6dfd8]" ebook={ebook} />
                    <span className="min-w-0">
                      <span className="block line-clamp-1 text-base font-bold">{ebook.title}</span>
                      <span className="mt-1 block truncate text-sm text-ink-muted">{ebook.author || "Chưa nhập tác giả"}{ebook.level ? ` · ${ebook.level}` : ""}</span>
                      <span className="mt-1 block truncate text-xs font-medium text-ink-muted/80">/{ebook.slug}</span>
                    </span>
                  </button>

                  <div className="hidden lg:block">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold"><FileText size={15} className="text-ink-muted" />{ebook.format?.toUpperCase()}</span>
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-sm font-semibold">{ebook.fileStorageProvider?.toUpperCase() || "Cloudinary"}</span>
                  </div>
                  <div className="hidden lg:block">
                    <Badge variant={ebook.isPublished ? "success" : "secondary"}>{ebook.isPublished ? "Hiển thị" : "Đang ẩn"}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e6dfd8] pt-3 lg:block lg:border-0 lg:pt-0">
                    <div className="flex flex-wrap items-center gap-2 lg:hidden">
                      <Badge variant={ebook.isPublished ? "success" : "secondary"}>{ebook.isPublished ? "Hiển thị" : "Đang ẩn"}</Badge>
                      <span className="text-xs font-semibold text-ink-muted">{ebook.format?.toUpperCase()}</span>
                      <span className="text-xs font-semibold text-ink-muted">{ebook.fileStorageProvider?.toUpperCase() || "Cloudinary"}</span>
                    </div>
                    <EbookActions ebook={ebook} navigate={navigate} onDelete={setDeletingEbook} onEdit={setEditingEbook} publishMutation={publish} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && filteredEbooks.length ? <Pagination currentPage={currentPage} onPageChange={changePage} totalPages={totalPages} /> : null}

        {!isLoading && !isError && !filteredEbooks.length ? (
          <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft/25 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-soft text-ink-muted"><BookOpen size={22} /></span>
            <h2 className="mt-4 text-lg font-bold">{ebooks.length ? "Không tìm thấy ebook" : "Thư viện chưa có ebook"}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-ink-muted">{ebooks.length ? "Thử đổi từ khoá hoặc bộ lọc trạng thái." : "Thêm ebook đầu tiên để bắt đầu xây dựng thư viện đọc."}</p>
            {!ebooks.length ? <Button className="mt-5" onClick={() => setCreateOpen(true)} type="button"><Plus size={16} /> Thêm ebook</Button> : null}
          </div>
        ) : null}

        <CreateEbookDialog createMutation={create} onOpenChange={setCreateOpen} open={createOpen} />
        <EbookEditDialog ebook={editingEbook} onOpenChange={(open) => !open && setEditingEbook(null)} updateMutation={update} />
        <DeleteEbookDialog ebook={deletingEbook} onOpenChange={(open) => !open && setDeletingEbook(null)} removeMutation={remove} />
      </div>
    </section>
  );
}
