import { ArrowLeft, Eye, EyeOff, Newspaper, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
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

export default function AdminReadingsPage() {
  const navigate = useNavigate();
  const { data: readings = [], isLoading, isError, error } = useReadings({ includeUnpublished: true });
  const createReadingMutation = useCreateReading();
  const updateReadingMutation = useUpdateReading();
  const deleteReadingMutation = useDeleteReading();
  const publishReadingMutation = usePublishReading();
  const isMutating = deleteReadingMutation.isPending || publishReadingMutation.isPending;

  async function deleteReading(reading) {
    if (!window.confirm(`Xoá bài đọc "${reading.title}"?`)) return;
    await deleteReadingMutation.mutateAsync(reading._id);
  }

  return (
    <section className="min-h-full bg-canvas px-4 py-8 text-coal sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button onClick={() => navigate("/")} size="sm" type="button" variant="ghost">
              <ArrowLeft size={16} /> Trang chủ
            </Button>
            <p className="eyebrow mt-5">Admin</p>
            <h1 className="mt-2 font-display text-4xl font-normal tracking-tight">Quản lý bài đọc</h1>
          </div>
          <ReadingEditorDialog
            createReadingMutation={createReadingMutation}
            updateReadingMutation={updateReadingMutation}
          />
        </div>

        {isLoading ? <LoadingState className="mt-8" label="Đang tải bài đọc..." /> : null}
        {isError ? <p className="mt-8 text-sm font-semibold text-red-700">{error?.response?.data?.message || "Không tải được bài đọc."}</p> : null}

        <div className="mt-8 grid gap-4">
          {readings.map((reading) => (
            <Card className="shadow-sm" key={reading._id}>
              <CardContent className="grid gap-4 p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                <button
                  className="aspect-[16/10] overflow-hidden rounded-lg bg-cream-soft text-left"
                  onClick={() => navigate(`/reading/${reading.slug}`)}
                  type="button"
                >
                  <img alt={reading.title} className="h-full w-full object-cover" src={reading.imageUrl} />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={reading.isPublished ? "success" : "secondary"}>
                      {reading.isPublished ? "Public" : "Ẩn"}
                    </Badge>
                    <span className="text-xs font-semibold text-ink-muted">{formatReadingDate(reading.publishedAt)}</span>
                    <span className="text-xs font-semibold text-ink-muted">{reading.questions?.length || 0} câu hỏi</span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-xl font-bold">{reading.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-muted">{reading.summary}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button onClick={() => navigate(`/reading/${reading.slug}`)} size="sm" type="button" variant="outline">
                    <Newspaper size={15} /> Xem
                  </Button>
                  <ReadingEditorDialog
                    createReadingMutation={createReadingMutation}
                    reading={reading}
                    trigger={
                      <Button size="sm" type="button" variant="outline">
                        <Pencil size={15} /> Sửa
                      </Button>
                    }
                    updateReadingMutation={updateReadingMutation}
                  />
                  <Button
                    disabled={isMutating}
                    onClick={() => publishReadingMutation.mutateAsync({ id: reading._id, isPublished: !reading.isPublished })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {reading.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                    {reading.isPublished ? "Ẩn" : "Public"}
                  </Button>
                  <Button disabled={isMutating} onClick={() => deleteReading(reading)} size="sm" type="button" variant="outline">
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
