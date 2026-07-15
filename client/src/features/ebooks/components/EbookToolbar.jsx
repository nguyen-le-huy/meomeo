import { BookMarked, Check, Library, Minus, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { READER_FONTS, READER_THEMES } from "../config/readerAppearance.js";

export default function EbookToolbar({ bookmarkCount = 0, settings, onSettings, onBookmark, onBack }) {
  return (
    <div className="fixed inset-x-0 top-12 z-30 h-14 border-b border-[#e6dfd8] bg-canvas/95 text-coal shadow-[0_1px_8px_rgba(20,20,19,0.04)] backdrop-blur-md md:top-16">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-3 px-2 sm:px-4">
        <Button aria-label="Quay lại thư viện" className="h-9 px-2 sm:px-3" onClick={onBack} title="Quay lại thư viện" type="button" variant="ghost">
          <Library size={17} />
          <span className="hidden text-xs sm:inline">Thư viện</span>
        </Button>

        <div className="flex min-w-0 items-center justify-end gap-1 rounded-xl border border-[#e8e0d7] bg-cream-soft/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:gap-1.5">
          <Button aria-label="Mở danh sách bookmark" className="relative" onClick={onBookmark} size="icon" title="Danh sách bookmark" type="button" variant="ghost">
            <BookMarked size={17} />
            {bookmarkCount ? <span className="absolute right-0.5 top-0.5 min-w-3.5 rounded-full bg-coral px-1 text-[9px] font-bold leading-3.5 text-white">{bookmarkCount > 99 ? "99+" : bookmarkCount}</span> : null}
          </Button>

          <div className="mx-0.5 h-6 w-px bg-[#ddd5cc]" />

          <div className="flex h-8 items-center rounded-lg border border-[#e3dcd3] bg-canvas shadow-sm">
            <Button aria-label="Giảm cỡ chữ" className="h-8 w-8 rounded-md" onClick={() => onSettings({ fontSize: Math.max(14, settings.fontSize - 1) })} size="icon" title="Giảm cỡ chữ" type="button" variant="ghost"><Minus size={14} /></Button>
            <span className="min-w-9 text-center text-[11px] font-bold tabular-nums sm:min-w-11">{settings.fontSize}<span className="hidden sm:inline"> px</span></span>
            <Button aria-label="Tăng cỡ chữ" className="h-8 w-8 rounded-md" onClick={() => onSettings({ fontSize: Math.min(30, settings.fontSize + 1) })} size="icon" title="Tăng cỡ chữ" type="button" variant="ghost"><Plus size={14} /></Button>
          </div>

          <div className="mx-0.5 h-6 w-px bg-[#ddd5cc]" />

          <Button aria-label="Mở cài đặt đọc" onClick={() => onSettings({ panel: true })} size="icon" title="Cài đặt đọc" type="button" variant="ghost"><Settings2 size={17} /></Button>
        </div>
      </div>
    </div>
  );
}

export function EbookSettingsPanel({ settings, onSave, isSaving, hasUnsavedSettings, onSettings, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ebook-settings-title">
      <button aria-label="Đóng cài đặt" className="absolute inset-0 bg-coal/45 backdrop-blur-[1px]" onClick={onClose} type="button" />
      <section className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded-lg border bg-cream-soft text-coal shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="pl-5 text-lg font-bold" id="ebook-settings-title">Cài đặt đọc</h2>
          <Button aria-label="Đóng cài đặt" onClick={onClose} size="icon" type="button" variant="ghost"><X size={18} /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <fieldset className="mt-3">
            <legend className="text-xs font-bold uppercase text-ink-muted">Kiểu chữ</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {READER_FONTS.map((font) => {
                const selected = settings.fontFamily === font.id;
                return (
                  <button
                    aria-pressed={selected}
                    className={`relative min-h-[76px] rounded-md border bg-canvas px-3 py-2.5 text-left transition hover:border-coral/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 ${selected ? "border-coral ring-1 ring-coral/25" : "border-[#ddd5cc]"}`}
                    key={font.id}
                    onClick={() => onSettings({ fontFamily: font.id })}
                    style={{ fontFamily: font.css }}
                    type="button"
                  >
                    <span className="block pr-5 text-base font-semibold">Aa</span>
                    <span className="mt-1 block truncate text-xs font-semibold">{font.label}</span>
                    {selected ? <Check className="absolute right-2 top-2 text-coral" size={15} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-xs font-bold uppercase text-ink-muted">Giao diện</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {READER_THEMES.map((theme) => {
                const selected = settings.theme === theme.id;
                return (
                  <button
                    aria-pressed={selected}
                    className={`relative flex min-h-[64px] items-center gap-2.5 rounded-md border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 ${selected ? "border-coral ring-1 ring-coral/25" : "border-[#ddd5cc]"}`}
                    key={theme.id}
                    onClick={() => onSettings({ theme: theme.id })}
                    style={{ backgroundColor: theme.background, color: theme.foreground }}
                    type="button"
                  >
                    <span className="h-7 w-7 shrink-0 rounded-full border" style={{ background: `linear-gradient(135deg, ${theme.background} 50%, ${theme.foreground} 50%)`, borderColor: theme.border }} />
                    <span className="min-w-0">
                      <span className="block text-xs font-bold">{theme.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] opacity-70">{theme.description}</span>
                    </span>
                    {selected ? <Check className="absolute right-2 top-2 text-coral" size={14} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold text-ink-muted">Giãn dòng
            <input className="accent-coral" max="2.2" min="1.2" step="0.05" type="range" value={settings.lineHeight} onChange={(event) => onSettings({ lineHeight: Number(event.target.value) })} />
            <span className="text-sm font-semibold text-coal">{settings.lineHeight.toFixed(2)}x</span>
          </label>
          <label className="grid gap-2 text-xs font-semibold text-ink-muted">Giãn chữ
            <input className="accent-coral" max="0.12" min="0" step="0.01" type="range" value={settings.letterSpacing} onChange={(event) => onSettings({ letterSpacing: Number(event.target.value) })} />
            <span className="text-sm font-semibold text-coal">{settings.letterSpacing.toFixed(2)}em</span>
          </label>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4">
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
                <BookMarked size={13} />
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
