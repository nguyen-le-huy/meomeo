import { Captions, Languages, Library, ListChecks, LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button.jsx";
import { useAuthStore } from "../../features/auth/stores/authStore.js";

const links = [
  { to: "/", Icon: Library, label: "Thư viện" },
  { to: "/?mode=toeic-test", Icon: ListChecks, label: "Luyện đề TOEIC" },
  { to: "/?mode=toeic-dictation", Icon: Captions, label: "Nghe chép chính tả TOEIC" },
  { to: "/?mode=bilingual", Icon: Languages, label: "Song Ngữ" },
];
const logoUrl = "https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif";

function Brand() {
  return (
    <NavLink aria-label="Meomeo home" className="inline-flex items-center" to="/">
      <img alt="Meomeo" className="h-10 w-10 shrink-0 object-contain" src={logoUrl} />
    </NavLink>
  );
}

function Navigation({ onNavigate }) {
  const location = useLocation();

  return links.map(({ Icon, label, to }) => {
    const query = to.split("?")[1] || "";
    const active = query ? location.search.includes(query) : location.pathname === "/" && !location.search;

    return (
      <NavLink
        className={active ? "flex items-center gap-2 text-sm font-semibold text-coal" : "flex items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-coal"}
        key={to}
        onClick={onNavigate}
        to={to}
      >
        <Icon className="md:hidden" size={17} />
        {label}
      </NavLink>
    );
  });
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const isLearningPage = location.pathname.startsWith("/videos/");

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas text-coal">
      <header className="sticky top-0 z-40 border-b bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-7 md:flex">
            <Navigation />
          </nav>

          <div className="hidden items-center gap-2 md:flex">
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

          <Button aria-label="Mở menu" className="md:hidden" onClick={() => setMobileOpen(true)} size="icon" type="button" variant="ghost">
            <Menu size={21} />
          </Button>
        </div>
      </header>

      <main className={isLearningPage ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-[calc(100vh-4rem)]"}>
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
            <nav className="mt-10 flex flex-col gap-6">
              <Navigation onNavigate={() => setMobileOpen(false)} />
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
