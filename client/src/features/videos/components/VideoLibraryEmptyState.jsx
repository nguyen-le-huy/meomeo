import { Card, CardContent } from "../../../components/ui/card.jsx";

export default function VideoLibraryEmptyState() {
  return (
    <Card className="border-dashed bg-cream-soft">
      <CardContent className="p-8 text-center">
        <p className="font-display text-2xl">Chưa có video nào.</p>
        <p className="mt-2 text-sm text-ink-muted">
          Admin đăng nhập rồi bấm “Thêm video” để tạo bài học đầu tiên.
        </p>
      </CardContent>
    </Card>
  );
}
