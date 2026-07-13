import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button.jsx";
import { useAuthStore } from "../../features/auth/stores/authStore.js";
import DictionaryPopover from "../../features/dictionary/components/DictionaryPopover.jsx";

const logoUrl = "https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif";
const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Học qua YouTube", to: "/youtube" },
  { label: "Luyện đọc", to: "/readings" },
];

function Brand() {
  return (
    <NavLink aria-label="Meomeo home" className="inline-flex items-center" to="/">
      <img alt="Meomeo" className="h-8 w-8 shrink-0 object-contain md:h-10 md:w-10" src={logoUrl} />
    </NavLink>
  );
}

function HeaderNavLink({ item, onClick }) {
  const location = useLocation();
  const isReadingActive = item.to === "/readings" && location.pathname.startsWith("/reading");
  const isYoutubeActive =
    item.to === "/youtube" &&
    (location.pathname.startsWith("/youtube") ||
      location.pathname.startsWith("/topics") ||
      location.pathname.startsWith("/videos"));

  return (
    <NavLink
      className={({ isActive }) =>
        [
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          isActive || isReadingActive || isYoutubeActive
            ? "bg-cream text-coal"
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
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryMode, setDictionaryMode] = useState("desktop");
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

  return (
    <div className="min-h-screen bg-canvas text-coal">
      <header className="sticky relative top-0 z-40 border-b bg-canvas/95 backdrop-blur">
        <div className="relative mx-auto flex h-12 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 md:h-16 lg:px-10">
          <Brand />

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
                onClick={() => toggleDictionary("desktop")}
                size="icon"
                type="button"
                variant="ghost"
              >
                <img alt="Dịch" className="h-5 w-5" src="https://res.cloudinary.com/dknin0hhf/image/upload/v1783514800/translate_zo4sh6.png" />
              </Button>
              {dictionaryOpen && dictionaryMode === "desktop" ? (
                <DictionaryPopover onClose={() => setDictionaryOpen(false)} />
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
            <DictionaryPopover onClose={() => setDictionaryOpen(false)} />
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
            <nav className="mt-8 grid gap-2">
              {navItems.map((item) => (
                <HeaderNavLink item={item} key={item.to} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
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
