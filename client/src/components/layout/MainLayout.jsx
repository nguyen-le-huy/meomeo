import { useState } from "react";
import {
  Bell,
  Captions,
  Headphones,
  Home,
  LogIn,
  LogOut,
  Menu,
  Mic,
  Video,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore.js";

const links = [
  { to: "/", Icon: Home, label: "Trang chủ" },
  { to: "/?mode=videos", Icon: Video, label: "Video YouTube" },
  { to: "/?mode=dictation", Icon: Captions, label: "Dictation" },
  { to: "/?mode=shadowing", Icon: Mic, label: "Shadowing" },
  { to: "/?mode=listen", Icon: Headphones, label: "Luyện nghe" },
];
const mobileLogoUrl = "https://res.cloudinary.com/dknin0hhf/image/upload/v1781682627/Black_Cat_Sticker_psynzk.gif";

function SidebarContent({ onLogout, onNavigate, user }) {
  return (
    <>
      <NavLink
        aria-label="Meomeo home"
        className="mb-5 flex items-center px-1"
        onClick={onNavigate}
        to="/"
      >
        <img alt="Meomeo" className="h-14 w-14 object-contain" src={mobileLogoUrl} />
      </NavLink>

      <nav className="space-y-1.5">
        {links.map((link, index) => {
          const Icon = link.Icon;
          return (
            <NavLink
              className={({ isActive }) =>
                [
                  "flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition",
                  isActive
                    ? "border border-coal/15 bg-matcha text-coal shadow-sm"
                    : "text-coal/70 hover:bg-matcha/50 hover:text-coal",
                ].join(" ")
              }
              key={`${link.to}-${index}`}
              onClick={onNavigate}
              to={link.to}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-matcha/70">
                <Icon aria-hidden="true" size={16} strokeWidth={2.4} />
              </span>
              <span className="leading-snug">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-coal/10 pt-4">
        {user?.role === "admin" ? (
          <button
            className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-bold text-red-500 transition hover:bg-red-50"
            onClick={onLogout}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut aria-hidden="true" size={16} strokeWidth={2.4} />
              Đăng xuất admin
            </span>
          </button>
        ) : (
          <NavLink
            className="flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold text-coal transition hover:bg-matcha/50"
            onClick={onNavigate}
            to="/login"
          >
            <LogIn aria-hidden="true" size={16} strokeWidth={2.4} />
            Admin login
          </NavLink>
        )}
      </div>
    </>
  );
}

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const isLearningPage = location.pathname.startsWith("/videos/");

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-matcha text-coal">
      <aside className="hidden w-[210px] shrink-0 flex-col border-r border-coal/15 bg-white/90 px-3 py-4 shadow-sm md:flex">
        <SidebarContent onLogout={handleLogout} user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className={["h-14 shrink-0 items-center justify-between border-b border-coal/10 bg-white/90 px-4 md:hidden", isLearningPage ? "hidden" : "flex"].join(" ")}>
          <button
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-coal hover:bg-matcha/60"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={22} strokeWidth={2.4} />
          </button>

          <NavLink aria-label="Meomeo home" className="flex items-center justify-center" to="/">
            <img alt="Meomeo" className="h-11 w-11 object-contain" src={mobileLogoUrl} />
          </NavLink>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-coal"
              type="button"
            >
              <Bell aria-hidden="true" size={18} strokeWidth={2.2} />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-coal/45"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-[255px] max-w-[86vw] flex-col border-r border-coal/15 bg-white px-3 py-4 shadow-2xl">
            <SidebarContent
              onLogout={handleLogout}
              onNavigate={() => setIsMobileMenuOpen(false)}
              user={user}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
