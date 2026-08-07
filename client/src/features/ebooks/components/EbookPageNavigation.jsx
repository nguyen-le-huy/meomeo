import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { getReaderTheme } from "../config/readerAppearance.js";

export default function EbookPageNavigation({ controls, settings }) {
  const theme = getReaderTheme(settings.theme);

  return (
    <div className="-mx-3 shrink-0 px-3 pb-2 pt-1.5" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto flex h-11 w-full max-w-md items-center justify-between gap-2 rounded-md border px-1.5 py-1" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <Button
          className="reader-static-button h-9 min-w-0 flex-1 justify-center gap-2 rounded-md px-2 text-xs"
          disabled={!controls?.prev}
          onClick={controls?.prev}
          style={{ color: theme.foreground }}
          type="button"
          variant="ghost"
        >
          <ChevronLeft size={16} />
          <span>Trang trước</span>
        </Button>
        <div className="h-6 w-px shrink-0" style={{ backgroundColor: theme.border }} />
        <Button
          className="reader-static-button h-9 min-w-0 flex-1 justify-center gap-2 rounded-md px-2 text-xs"
          disabled={!controls?.next}
          onClick={controls?.next}
          style={{ color: theme.foreground }}
          type="button"
          variant="ghost"
        >
          <span>Trang sau</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
