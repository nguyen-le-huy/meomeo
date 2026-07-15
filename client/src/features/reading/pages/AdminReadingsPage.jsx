import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Newspaper,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Pagination } from "../../../components/ui/pagination.jsx";
import { LoadingState } from "../../../components/ui/spinner.jsx";
import ReadingEditorDialog from "../components/ReadingEditorDialog.jsx";
import {
  useCreateReading,
  useDeleteReading,
  usePublishReading,
  useReadings,
  useUpdateReading,
} from "../hooks/useReadings.js";
import { formatReadingDate } from "../utils/readingFormat.js";

const pageSize = 9;

function getWordCount(reading) {
  if (reading.wordCount) return reading.wordCount;
  return (reading.paragraphs || []).join(" ").trim().split(/\s+/).filter(Boolean).length;
}

function BlogCover({ reading }) {
  if (reading.imageUrl) {
    return <img alt={reading.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={reading.imageUrl} />;
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-cream-soft text-ink-muted">
      <Newspaper size={28} strokeWidth={1.5} />
    </span>
  );
}

function DeleteBlogDialog({ deleteMutation, onOpenChange, reading }) {
  async function confirmDelete() {
    if (!reading?._id) return;
    try {
      await deleteMutation.mutateAsync(reading._id);
      onOpenChange(false);
    } catch {
      // Keep the dialog open so the user can retry.
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(reading)}>
      <DialogContent className="sm:max-w-md">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={20} />
        </span>
        <DialogHeader>
          <DialogTitle>Xoá bài viết?</DialogTitle>
          <DialogDescription>
            “{reading?.title}” cùng nội dung và bộ câu hỏi đọc hiểu sẽ bị xoá vĩnh viễn. Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        {deleteMutation.isError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Không xoá được bài viết. Vui lòng thử lại.</p> : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button disabled={deleteMutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">Huỷ</Button>
          <Button disabled={deleteMutation.isPending} onClick={confirmDelete} type="button" variant="destructive">
            <Trash2 size={15} /> {deleteMutation.isPending ? "Đang xoá..." : "Xoá bài viết"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BlogActions({ createMutation, navigate, onDelete, publishMutation, reading, updateMutation }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button aria-label={`Xem ${reading.title}`} onClick={() => navigate(`/reading/${reading.slug}`)} size="icon" title="Xem bài viết" type="button" variant="ghost">
        <Eye size={16} />
      </Button>
      <ReadingEditorDialog
        createReadingMutation={createMutation}
        reading={reading}
        trigger={
          <Button aria-label={`Sửa ${reading.title}`} size="icon" title="Chỉnh sửa" type="button" variant="ghost">
            <Edit3 size={16} />
          </Button>
        }
        updateReadingMutation={updateMutation}
      />
      <Button
        aria-label={reading.isPublished ? `Ẩn ${reading.title}` : `Xuất bản ${reading.title}`}
        disabled={publishMutation.isPending}
        onClick={() => publishMutation.mutate({ id: reading._id, isPublished: !reading.isPublished })}
        size="icon"
        title={reading.isPublished ? "Chuyển về bản nháp" : "Xuất bản"}
        type="button"
        variant="ghost"
      >
        {reading.isPublished ? <EyeOff size={16} /> : <CheckCircle2 size={16} />}
      </Button>
      <Button aria-label={`Xoá ${reading.title}`} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(reading)} size="icon" title="Xoá" type="button" variant="ghost">
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export default function AdminReadingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingReading, setDeletingReading] = useState(null);
  const listTopRef = useRef(null);
  const { data: readings = [], isLoading, isError, error } = useReadings({ includeUnpublished: true });
  const createReadingMutation = useCreateReading();
  const updateReadingMutation = useUpdateReading();
  const deleteReadingMutation = useDeleteReading();
  const publishReadingMutation = usePublishReading();

  const stats = useMemo(() => ({
    total: readings.length,
    published: readings.filter((reading) => reading.isPublished).length,
    drafts: readings.filter((reading) => !reading.isPublished).length,
    questions: readings.reduce((total, reading) => total + (reading.questions?.length || 0), 0),
  }), [readings]);

  const filteredReadings = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return readings.filter((reading) => {
      if (status === "published" && !reading.isPublished) return false;
      if (status === "draft" && reading.isPublished) return false;
      if (!keyword) return true;
      return [reading.title, reading.summary, reading.author, reading.slug, reading.level]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(keyword));
    });
  }, [readings, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / pageSize));
  const visibleReadings = filteredReadings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    { id: "published", label: "Đã xuất bản", count: stats.published },
    { id: "draft", label: "Bản nháp", count: stats.drafts },
  ];

  return (
    <section className="min-h-full bg-canvas px-4 py-7 text-coal sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Button onClick={() => navigate("/reading")} size="sm" type="button" variant="ghost">
          <ArrowLeft size={16} /> Thư viện bài đọc
        </Button>

        <header className="mt-5 flex flex-col gap-5 border-b border-[#e6dfd8] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Blog · Admin</p>
            <h1 className="mt-2 font-display text-4xl font-normal tracking-tight sm:text-5xl">Quản lý blog</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Biên tập bài viết, quản lý lịch xuất bản và xây dựng bộ câu hỏi đọc hiểu đi kèm.</p>
          </div>
          <ReadingEditorDialog
            createReadingMutation={createReadingMutation}
            trigger={
              <Button className="w-full sm:w-auto" size="lg" type="button">
                <Plus size={18} /> Viết bài mới
              </Button>
            }
            updateReadingMutation={updateReadingMutation}
          />
        </header>

        <div className="grid border-b border-[#e6dfd8] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Newspaper, label: "Tổng bài viết", value: stats.total },
            { icon: Eye, label: "Đã xuất bản", value: stats.published },
            { icon: FileText, label: "Bản nháp", value: stats.drafts },
            { icon: CircleHelp, label: "Câu hỏi đọc hiểu", value: stats.questions },
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
                {filter.label}<span className="text-xs font-bold text-ink-muted">{filter.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
            <Input className="pl-9" placeholder="Tìm tiêu đề, tác giả, chuyên mục..." value={search} onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }} />
          </div>
        </div>

        <div className="scroll-mt-24" ref={listTopRef} />

        {isLoading ? <LoadingState className="mt-10" label="Đang tải bài viết..." /> : null}
        {isError ? <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error?.response?.data?.message || "Không tải được danh sách bài viết."}</p> : null}

        {!isLoading && !isError && filteredReadings.length ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-[#e6dfd8] bg-canvas">
            <div className="hidden grid-cols-[minmax(360px,1fr)_150px_130px_120px_150px] items-center gap-4 border-b border-[#e6dfd8] bg-cream-soft/55 px-5 py-3 text-xs font-bold uppercase text-ink-muted xl:grid">
              <span>Bài viết</span><span>Tác giả</span><span>Ngày đăng</span><span>Trạng thái</span><span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-[#e6dfd8]">
              {visibleReadings.map((reading) => (
                <article className="grid gap-4 px-4 py-4 transition hover:bg-cream-soft/30 xl:grid-cols-[minmax(360px,1fr)_150px_130px_120px_150px] xl:items-center xl:px-5" key={reading._id}>
                  <button className="group flex min-w-0 items-center gap-4 text-left" onClick={() => navigate(`/reading/${reading.slug}`)} type="button">
                    <span className="h-[78px] w-[124px] shrink-0 overflow-hidden rounded-md bg-cream-soft ring-1 ring-[#e6dfd8]">
                      <BlogCover reading={reading} />
                    </span>
                    <span className="min-w-0">
                      <span className="block line-clamp-2 text-base font-bold leading-snug">{reading.title}</span>
                      <span className="mt-1 block line-clamp-1 text-sm text-ink-muted">{reading.summary}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
                        <span>{reading.level}</span>
                        <span>·</span>
                        <span>{getWordCount(reading)} từ</span>
                        <span>·</span>
                        <span>{reading.questions?.length || 0} câu hỏi</span>
                      </span>
                    </span>
                  </button>

                  <div className="hidden min-w-0 xl:block">
                    <span className="flex items-center gap-1.5 truncate text-sm font-semibold"><UserRound className="shrink-0 text-ink-muted" size={14} />{reading.author || "Meo Meo English"}</span>
                  </div>
                  <div className="hidden xl:block">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted"><CalendarDays size={14} />{formatReadingDate(reading.publishedAt)}</span>
                  </div>
                  <div className="hidden xl:block">
                    <Badge variant={reading.isPublished ? "success" : "secondary"}>{reading.isPublished ? "Đã đăng" : "Bản nháp"}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e6dfd8] pt-3 xl:block xl:border-0 xl:pt-0">
                    <div className="flex flex-wrap items-center gap-2 xl:hidden">
                      <Badge variant={reading.isPublished ? "success" : "secondary"}>{reading.isPublished ? "Đã đăng" : "Bản nháp"}</Badge>
                      <span className="text-xs font-semibold text-ink-muted">{formatReadingDate(reading.publishedAt)}</span>
                    </div>
                    <BlogActions
                      createMutation={createReadingMutation}
                      navigate={navigate}
                      onDelete={setDeletingReading}
                      publishMutation={publishReadingMutation}
                      reading={reading}
                      updateMutation={updateReadingMutation}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && filteredReadings.length ? <Pagination currentPage={currentPage} onPageChange={changePage} totalPages={totalPages} /> : null}

        {!isLoading && !isError && !filteredReadings.length ? (
          <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0c6] bg-cream-soft/25 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-soft text-ink-muted"><Newspaper size={22} /></span>
            <h2 className="mt-4 text-lg font-bold">{readings.length ? "Không tìm thấy bài viết" : "Blog chưa có bài viết"}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-ink-muted">{readings.length ? "Thử đổi từ khoá hoặc bộ lọc trạng thái." : "Viết bài đầu tiên để bắt đầu xây dựng thư viện nội dung."}</p>
          </div>
        ) : null}

        <DeleteBlogDialog deleteMutation={deleteReadingMutation} onOpenChange={(open) => !open && setDeletingReading(null)} reading={deletingReading} />
      </div>
    </section>
  );
}
