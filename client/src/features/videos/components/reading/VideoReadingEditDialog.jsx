import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Textarea } from "../../../../components/ui/textarea.jsx";
import { Spinner } from "../../../../components/ui/spinner.jsx";

export default function VideoReadingEditDialog({
  isOpen,
  onClose,
  onSave,
  segment,
}) {
  const [text, setText] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (segment) {
      setText(segment.text || "");
      setTranslationText(segment.translationText || "");
      setError("");
    }
  }, [segment]);

  async function handleSave(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Nội dung tiếng Anh không được để trống");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave?.(segment._id, {
        text: text.trim(),
        translationText: translationText.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  }

  if (!segment) return null;

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="max-w-lg bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-coal">
            Chỉnh sửa câu phụ đề #{segment.index}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-coal">
              Tiếng Anh (Phụ đề chính)
            </label>
            <Textarea
              className="min-h-20 resize-y bg-canvas font-medium text-coal"
              disabled={isSaving}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              value={text}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-coal">
              Tiếng Việt (Bản dịch bên dưới)
            </label>
            <Textarea
              className="min-h-20 resize-y bg-canvas text-[#57534e]"
              disabled={isSaving}
              onChange={(e) => setTranslationText(e.target.value)}
              placeholder="Nhập bản dịch tiếng Việt cho câu này..."
              rows={3}
              value={translationText}
            />
          </div>

          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              disabled={isSaving}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Hủy
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? (
                <Spinner className="mr-1.5" size="sm" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
