import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";

export default function VideoLibraryErrorState({ error, onRetry }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="space-y-3 p-6 text-center">
        <p className="font-display text-2xl text-red-900">Không tải được video.</p>
        <p className="mx-auto max-w-xl text-sm text-red-700">
          {error?.response?.data?.message ||
            "Trình duyệt trong Instagram đang chặn web - dùng safari, chrome,... sẽ tốt hơn."}
        </p>
        <Button onClick={onRetry} type="button" variant="outline">
          Tải lại
        </Button>
      </CardContent>
    </Card>
  );
}
