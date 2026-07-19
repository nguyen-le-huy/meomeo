import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button.jsx";
import { useAuthStore } from "../../features/auth/stores/authStore.js";
import DictionaryPopover from "../../features/dictionary/components/DictionaryPopover.jsx";

const logoUrl = "https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif";
const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Học qua YouTube", to: "/youtube" },
  { label: "Netflix Chill", to: "/netflix" },
  { label: "Từ vựng mỗi ngày", to: "/vocabulary" },
  { label: "Ebook", to: "/ebooks" },
  { label: "Từ đã tra", to: "/dictionary/history" },
];

function Brand({ dark = false }) {
  return (
    <NavLink aria-label="Meomeo home" className="inline-flex items-center" to="/">
      <img
        alt="Meomeo"
        className={`h-8 w-8 shrink-0 object-contain md:h-10 md:w-10 ${dark ? "brightness-0 invert" : ""}`}
        src={logoUrl}
      />
    </NavLink>
  );
}

function HeaderNavLink({ item, onClick }) {
  const location = useLocation();
  const isReadingActive = item.to === "/reading" && location.pathname.startsWith("/reading");
  const isVocabularyActive = item.to === "/vocabulary" && location.pathname.startsWith("/vocabulary");
  const isYoutubeActive =
    item.to === "/youtube" &&
    (location.pathname.startsWith("/youtube") ||
      location.pathname.startsWith("/topics") ||
      location.pathname.startsWith("/videos"));
  const isMovieRoute = location.pathname.startsWith("/netflix") || location.pathname.startsWith("/movies");
  const isNetflixActive = item.to === "/netflix" && isMovieRoute;
  const isDark = isMovieRoute;

  return (
    <NavLink
      className={({ isActive }) =>
        [
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          isActive || isReadingActive || isVocabularyActive || isYoutubeActive || isNetflixActive
            ? isDark
              ? "bg-white/10 text-white"
              : "bg-cream text-coal"
            : isDark
              ? "text-white/55 hover:bg-white/[0.06] hover:text-white"
              : "text-ink-muted hover:bg-cream-soft hover:text-coal",
        ].join(" ")
      }
      end={item.to === "/"}
      onClick={onClick}
      to={item.to}
    >
      {item.label}
    </NavLink>
  );
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryMode, setDictionaryMode] = useState("desktop");
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const isNetflixPage = location.pathname.startsWith("/netflix") || location.pathname.startsWith("/movies");
  const isNetflixPlayerPage = /^\/(netflix|movies)\/[^/]+$/.test(location.pathname);
  const isImmersivePage = location.pathname.startsWith("/videos/") || location.pathname.startsWith("/reading/") || location.pathname.startsWith("/ebooks/") || isNetflixPlayerPage;

  useEffect(() => {
    if (mobileOpen) {
      setMobileMenuMounted(true);
      const timeoutId = window.setTimeout(() => setMobileMenuVisible(true), 16);
      return () => window.clearTimeout(timeoutId);
    }

    setMobileMenuVisible(false);
    if (!mobileMenuMounted) return undefined;
    const timeoutId = window.setTimeout(() => setMobileMenuMounted(false), 240);
    return () => window.clearTimeout(timeoutId);
  }, [mobileMenuMounted, mobileOpen]);

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

  return (
    <div className={`${isImmersivePage ? "h-[100dvh] overflow-hidden" : "min-h-screen"} flex flex-col ${isNetflixPage ? "bg-[#090908] text-white" : "bg-canvas text-coal"}`}>
      <header
        className={`${isNetflixPlayerPage ? "hidden" : "sticky"} top-0 z-40 shrink-0 border-b backdrop-blur-xl transition-colors duration-300 ${
          isNetflixPage ? "border-white/[0.08] bg-[#0b0b0a]/95 text-white" : "bg-canvas/95 text-coal"
        }`}
      >
        <div className="relative mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 md:h-16 lg:px-10">
          <Brand dark={isNetflixPage} />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navItems.map((item) => (
              <HeaderNavLink item={item} key={item.to} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <Button
                aria-expanded={dictionaryOpen}
                aria-label="Mở từ điển"
                className={isNetflixPage ? "text-white hover:bg-white/10" : undefined}
                onClick={() => toggleDictionary("desktop")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <img alt="Dịch" className={`h-5 w-5 ${isNetflixPage ? "brightness-0 invert" : ""}`} src="https://res.cloudinary.com/dknin0hhf/image/upload/v1783514800/translate_zo4sh6.png" />
              </Button>
              {dictionaryOpen && dictionaryMode === "desktop" ? (
                <DictionaryPopover onClose={() => setDictionaryOpen(false)} />
              ) : null}
            </div>
            {user?.role === "admin" ? (
              <>
                <span className={`mr-1 rounded-full px-3 py-1.5 text-xs font-semibold ${isNetflixPage ? "bg-white/10 text-white/75" : "bg-cream text-ink-body"}`}>Admin</span>
                <Button aria-label="Đăng xuất" className={isNetflixPage ? "text-white hover:bg-white/10" : undefined} onClick={handleLogout} size="icon" type="button" variant="ghost">
                  <LogOut size={17} />
                </Button>
              </>
            ) : (
              <Button
                className={isNetflixPage ? "border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/10" : undefined}
                onClick={() => navigate("/login")}
                size="sm"
                type="button"
                variant="outline"
              >
                <LogIn size={16} /> Admin
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Button
              aria-expanded={dictionaryOpen}
              aria-label="Mở từ điển"
              className={`h-9 w-9 ${isNetflixPage ? "text-white hover:bg-white/10" : ""}`}
              onClick={() => toggleDictionary("mobile")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <img alt="Dịch" className={`h-5 w-5 ${isNetflixPage ? "brightness-0 invert" : ""}`} src="https://res.cloudinary.com/dknin0hhf/image/upload/v1783514800/translate_zo4sh6.png" />
            </Button>
            <Button
              aria-label="Mở menu"
              className={`h-9 w-9 ${isNetflixPage ? "text-white hover:bg-white/10" : ""}`}
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
      </header>

      {dictionaryOpen && dictionaryMode === "mobile" ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Đóng từ điển"
            className="absolute inset-0 bg-coal/55 backdrop-blur-[1px]"
            onClick={() => setDictionaryOpen(false)}
            type="button"
          />
          <DictionaryPopover
            mobile
            onClose={() => setDictionaryOpen(false)}
          />
        </div>
      ) : null}

      <main className={isImmersivePage ? "min-h-0 flex-1 overflow-hidden" : "flex-1"}>
        <Outlet />
      </main>

      {mobileMenuMounted ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Đóng menu"
            className={`absolute inset-0 bg-coal/40 transition-opacity duration-250 ease-out ${mobileMenuVisible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside
            className={`absolute right-0 top-0 flex h-full w-[290px] transform-gpu flex-col p-5 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isNetflixPage ? "bg-[#11110f] text-white" : "bg-canvas text-coal"
            } ${mobileMenuVisible ? "translate-x-0 opacity-100" : "translate-x-[108%] opacity-0"}`}
          >
            <div className="flex items-center justify-between">
              <Brand dark={isNetflixPage} />
              <Button aria-label="Đóng menu" className={isNetflixPage ? "text-white hover:bg-white/10" : undefined} onClick={() => setMobileOpen(false)} size="icon" type="button" variant="ghost">
                <X size={20} />
              </Button>
            </div>
            <nav className="mt-8 grid gap-2">
              {navItems.map((item) => (
                <HeaderNavLink item={item} key={item.to} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className={`mt-auto border-t pt-5 ${isNetflixPage ? "border-white/10" : "border-[#e6dfd8]"}`}>
              {user?.role === "admin" ? (
                <Button className={`w-full ${isNetflixPage ? "border-white/20 bg-transparent text-white hover:bg-white/10" : ""}`} onClick={handleLogout} type="button" variant="outline">
                  <LogOut size={16} /> Đăng xuất admin
                </Button>
              ) : (
                <Button className={`w-full ${isNetflixPage ? "bg-white text-black hover:bg-white/85" : ""}`} onClick={() => navigate("/login")} type="button">
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
