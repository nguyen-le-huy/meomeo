import { ArrowLeftToLine, Bookmark, ChevronLeft, ChevronRight, Minus, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";

export default function EbookToolbar({ settings, onSettings, onBookmark, onBack, onNext, onPrev }) {
  return (
    <div className="fixed inset-x-0 top-12 z-30 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b bg-canvas/95 px-3 py-2 text-coal backdrop-blur md:top-16 md:min-h-16">
      <Button aria-label="Quay lại thư viện" onClick={onBack} size="icon" type="button" variant="ghost"><ArrowLeftToLine size={18} /></Button>
      <div className="flex items-center gap-1">
        <Button aria-label="Trang trước" disabled={!onPrev} onClick={onPrev} size="icon" type="button" variant="ghost"><ChevronLeft size={17} /></Button>
        <Button aria-label="Trang sau" disabled={!onNext} onClick={onNext} size="icon" type="button" variant="ghost"><ChevronRight size={17} /></Button>
        <Button aria-label="Mở danh sách bookmark" onClick={onBookmark} size="icon" type="button" variant="ghost"><Bookmark size={17} /></Button>
      </div>
      <div className="flex items-center gap-1">
        <Button aria-label="Giảm cỡ chữ" onClick={() => onSettings({ fontSize: Math.max(14, settings.fontSize - 1) })} size="icon" type="button" variant="ghost"><Minus size={16} /></Button>
        <span className="min-w-10 text-center text-xs font-semibold">{settings.fontSize}px</span>
        <Button aria-label="Tăng cỡ chữ" onClick={() => onSettings({ fontSize: Math.min(30, settings.fontSize + 1) })} size="icon" type="button" variant="ghost"><Plus size={16} /></Button>
        <Button aria-label="Mở cài đặt đọc" onClick={() => onSettings({ panel: true })} size="icon" type="button" variant="ghost"><Settings2 size={17} /></Button>
      </div>
    </div>
  );
}

export function EbookSettingsPanel({ settings, onSave, isSaving, hasUnsavedSettings, onSettings, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ebook-settings-title">
      <button aria-label="Đóng cài đặt" className="absolute inset-0 bg-coal/45 backdrop-blur-[1px]" onClick={onClose} type="button" />
      <section className="relative z-10 w-full max-w-lg rounded-lg border bg-cream-soft p-5 text-coal shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold" id="ebook-settings-title">Cài đặt đọc</h2>
          <Button aria-label="Đóng cài đặt" onClick={onClose} size="icon" type="button" variant="ghost"><X size={18} /></Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-ink-muted">Font
            <select className="h-10 rounded-md border bg-canvas px-3 text-sm text-coal" value={settings.fontFamily} onChange={(event) => onSettings({ fontFamily: event.target.value })}>
              <option value="serif">Serif</option><option value="sans">Sans</option><option value="bbc">BBC Reith Serif</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-muted">Theme
            <select className="h-10 rounded-md border bg-canvas px-3 text-sm text-coal" value={settings.theme} onChange={(event) => onSettings({ theme: event.target.value })}>
              <option value="light">Sáng</option><option value="sepia">Sepia</option><option value="dark">Tối</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold text-ink-muted">Giãn dòng
            <input className="accent-coral" max="2.2" min="1.2" step="0.05" type="range" value={settings.lineHeight} onChange={(event) => onSettings({ lineHeight: Number(event.target.value) })} />
            <span className="text-sm font-semibold text-coal">{settings.lineHeight.toFixed(2)}x</span>
          </label>
          <label className="grid gap-2 text-xs font-semibold text-ink-muted">Giãn chữ
            <input className="accent-coral" max="0.12" min="0" step="0.01" type="range" value={settings.letterSpacing} onChange={(event) => onSettings({ letterSpacing: Number(event.target.value) })} />
            <span className="text-sm font-semibold text-coal">{settings.letterSpacing.toFixed(2)}em</span>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs font-semibold text-ink-muted">{hasUnsavedSettings ? "Có thay đổi chưa lưu" : "Cài đặt đang đồng bộ"}</span>
          <Button disabled={!hasUnsavedSettings || isSaving} onClick={onSave} size="sm" type="button">
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function EbookBookmarksPanel({ bookmarks, onBookmarkClick, onBookmarkRemove, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ebook-bookmarks-title">
      <button aria-label="Đóng danh sách bookmark" className="absolute inset-0 bg-coal/45 backdrop-blur-[1px]" onClick={onClose} type="button" />
      <section className="relative z-10 w-full max-w-lg rounded-lg border bg-cream-soft p-5 text-coal shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold" id="ebook-bookmarks-title">Danh sách bookmark</h2>
          <Button aria-label="Đóng danh sách bookmark" onClick={onClose} size="icon" type="button" variant="ghost"><X size={18} /></Button>
        </div>
        <div className="mt-4 max-h-[min(60vh,24rem)] space-y-2 overflow-y-auto">
          {bookmarks.length ? bookmarks.map((bookmark) => (
            <div className="flex min-w-0 overflow-hidden rounded-md border bg-canvas" key={bookmark._id}>
              <Button className="min-w-0 flex-1 justify-start rounded-none border-0 text-left" onClick={() => { onBookmarkClick(bookmark); onClose(); }} size="sm" type="button" variant="ghost">
                <Bookmark size={13} />
                <span className="truncate">{bookmark.label || "Vị trí đã lưu"}</span>
              </Button>
              <Button aria-label="Xoá bookmark" className="shrink-0 rounded-none border-l px-2" onClick={() => onBookmarkRemove(bookmark)} size="sm" type="button" variant="ghost"><Trash2 size={13} /></Button>
            </div>
          )) : <p className="text-sm text-ink-muted">Chưa có bookmark</p>}
        </div>
      </section>
    </div>
  );
}
