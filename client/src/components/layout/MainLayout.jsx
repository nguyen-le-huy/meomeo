import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button.jsx";
import { useAuthStore } from "../../features/auth/stores/authStore.js";

const logoUrl = "https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif";
const labanDictionaryConfig = { s: "https://dict.laban.vn", w: 260, h: 260, hl: 2, th: 3 };
const labanDictionaryMarkerId = "lbdict_plugin_frame";
const labanDictionaryScriptId = "lbdict_plugin_frame_loader";
const labanDictionaryScriptUrl = "https://stc-laban.zdn.vn/dictionary/js/plugin/lbdictplugin.frame.min.js";

function Brand() {
  return (
    <NavLink aria-label="Meomeo home" className="inline-flex items-center" to="/">
      <img alt="Meomeo" className="h-8 w-8 shrink-0 object-contain md:h-10 md:w-10" src={logoUrl} />
    </NavLink>
  );
}

function DictionaryPopover({ dictionaryPanelRef, onClose }) {
  return (
    <div className="pointer-events-auto absolute right-1/2 top-[calc(100%+0.5rem)] z-50 w-[260px] translate-x-1/2 overflow-hidden rounded-md border border-[#d8d0c6] bg-white shadow-2xl md:right-auto md:left-1/2 md:-translate-x-1/2">
      <div className="flex h-8 items-center justify-between border-b border-[#e6dfd8] bg-canvas px-2">
        <span className="text-xs font-semibold text-ink-muted">Từ điển</span>
        <button
          aria-label="Đóng từ điển"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-coal transition hover:bg-cream-soft"
          onClick={onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>
      <div className="min-h-[260px] [&_iframe]:block [&_iframe]:pointer-events-auto" ref={dictionaryPanelRef} />
    </div>
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryMode, setDictionaryMode] = useState("desktop");
  const dictionaryPanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const isLearningPage = location.pathname.startsWith("/videos/");

  function handleLogout() {
    logout();
    setMobileOpen(false);
    setDictionaryOpen(false);
    navigate("/", { replace: true });
  }

  function toggleDictionary(mode) {
    setDictionaryMode(mode);
    setDictionaryOpen((current) => (dictionaryMode === mode ? !current : true));
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!dictionaryOpen) return undefined;

    const panel = dictionaryPanelRef.current;
    if (!panel) return undefined;

    panel.replaceChildren();

    const marker = document.createElement("script");
    marker.id = labanDictionaryMarkerId;
    marker.type = "text/javascript";
    panel.appendChild(marker);

    const initDictionary = () => {
      window.lbDictPluginFrame?.init?.(labanDictionaryConfig);
    };

    if (window.lbDictPluginFrame) {
      initDictionary();
      return undefined;
    }

    const existingScript = document.getElementById(labanDictionaryScriptId);
    if (existingScript) {
      existingScript.addEventListener("load", initDictionary, { once: true });
      return () => existingScript.removeEventListener("load", initDictionary);
    }

    const script = document.createElement("script");
    script.id = labanDictionaryScriptId;
    script.type = "text/javascript";
    script.src = labanDictionaryScriptUrl;
    script.addEventListener("load", initDictionary, { once: true });
    document.body.appendChild(script);

    return () => script.removeEventListener("load", initDictionary);
  }, [dictionaryMode, dictionaryOpen]);

  return (
    <div className="min-h-screen bg-canvas text-coal">
      <header className="sticky relative top-0 z-40 border-b bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 md:h-16 lg:px-10">
          <Brand />

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <Button
                aria-expanded={dictionaryOpen}
                aria-label="Mở từ điển"
                onClick={() => toggleDictionary("desktop")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <img alt="Dịch" className="h-5 w-5" src="https://res.cloudinary.com/dknin0hhf/image/upload/v1783514800/translate_zo4sh6.png" />
              </Button>
              {dictionaryOpen && dictionaryMode === "desktop" ? (
                <DictionaryPopover dictionaryPanelRef={dictionaryPanelRef} onClose={() => setDictionaryOpen(false)} />
              ) : null}
            </div>
            {user?.role === "admin" ? (
              <>
                <span className="mr-1 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink-body">Admin</span>
                <Button aria-label="Đăng xuất" onClick={handleLogout} size="icon" type="button" variant="ghost">
                  <LogOut size={17} />
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/login")} size="sm" type="button" variant="outline">
                <LogIn size={16} /> Admin
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Button
              aria-expanded={dictionaryOpen}
              aria-label="Mở từ điển"
              className="h-9 w-9"
              onClick={() => toggleDictionary("mobile")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <img alt="Dịch" className="h-5 w-5" src="https://res.cloudinary.com/dknin0hhf/image/upload/v1783514800/translate_zo4sh6.png" />
            </Button>
            <Button
              aria-label="Mở menu"
              className="h-9 w-9"
              onClick={() => {
                setMobileOpen(true);
                setDictionaryOpen(false);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Menu size={21} />
            </Button>
          </div>
        </div>

        {dictionaryOpen && dictionaryMode === "mobile" ? (
          <div className="md:hidden">
            <DictionaryPopover dictionaryPanelRef={dictionaryPanelRef} onClose={() => setDictionaryOpen(false)} />
          </div>
        ) : null}
      </header>

      <main className={isLearningPage ? "h-[calc(100vh-3rem)] overflow-hidden md:h-[calc(100vh-4rem)]" : "min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-4rem)]"}>
        <Outlet />
      </main>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Đóng menu" className="absolute inset-0 bg-coal/40" onClick={() => setMobileOpen(false)} type="button" />
          <aside className="absolute right-0 top-0 flex h-full w-[290px] flex-col bg-canvas p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <Button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} size="icon" type="button" variant="ghost">
                <X size={20} />
              </Button>
            </div>
            <div className="mt-auto border-t border-[#e6dfd8] pt-5">
              {user?.role === "admin" ? (
                <Button className="w-full" onClick={handleLogout} type="button" variant="outline">
                  <LogOut size={16} /> Đăng xuất admin
                </Button>
              ) : (
                <Button className="w-full" onClick={() => navigate("/login")} type="button">
                  <LogIn size={16} /> Đăng nhập admin
                </Button>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
