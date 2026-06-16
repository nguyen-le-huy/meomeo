import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore.js";

const links = [
  { to: "/dashboard", icon: "H", label: "Trang chủ" },
  { to: "/vocabulary", icon: "V", label: "Từ vựng" },
  { to: "/grammar", icon: "G", label: "Ngữ pháp" },
  { to: "/speech", icon: "S", label: "Shadowing và dictation với Youtube" },
  { to: "/exercises", icon: "T", label: "Luyện thi TOEIC" },
  { to: "/exercises", icon: "D", label: "Dictation với TOEIC" },
];

function SidebarContent({ onLogout, onNavigate, user }) {
  return (
    <>
      <NavLink
        className="mb-5 flex items-center gap-2 px-1 text-sm font-bold"
        onClick={onNavigate}
        to="/dashboard"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-matcha text-sm font-black">
          M
        </span>
        Meomeo
      </NavLink>

      <nav className="space-y-1.5">
        {links.map((link, index) => (
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
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-matcha/70 text-xs font-black">
              {link.icon}
            </span>
            <span className="leading-snug">{link.label}</span>
          </NavLink>
        ))}
        {user?.role === "admin" ? (
          <NavLink
            className={({ isActive }) =>
              [
                "flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition",
                isActive
                  ? "border border-coal/15 bg-matcha text-coal shadow-sm"
                  : "text-coal/70 hover:bg-matcha/50 hover:text-coal",
              ].join(" ")
            }
            onClick={onNavigate}
            to="/admin"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-matcha/70 text-xs font-black">
              A
            </span>
            <span>Quản trị</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="mt-auto border-t border-coal/10 pt-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coal text-sm font-bold text-matcha">
            {user?.name?.charAt(0) || "M"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{user?.name || "Meomeo"}</p>
            <p className="text-[11px] text-coal/50">{user?.role || "student"}</p>
          </div>
        </div>
        <button
          className="w-full rounded-xl px-3 py-2 text-left text-[13px] font-bold text-red-500 transition hover:bg-red-50"
          onClick={onLogout}
          type="button"
        >
          Dang xuat
        </button>
      </div>
    </>
  );
}

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  function handleLogout() {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-matcha text-coal">
      <aside className="hidden w-[210px] shrink-0 flex-col border-r border-coal/15 bg-white/90 px-3 py-4 shadow-sm md:flex">
        <SidebarContent onLogout={handleLogout} user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-coal/10 bg-white/90 px-4 md:hidden">
          <button
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-coal hover:bg-matcha/60"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            ☰
          </button>

          <NavLink className="flex items-center gap-2 text-sm font-bold" to="/dashboard">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-matcha text-sm font-black">
              M
            </span>
            Meomeo
          </NavLink>

          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-coal/10 bg-matcha/35 text-sm font-bold text-coal"
              type="button"
            >
              S
            </button>
            <button
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-coal"
              type="button"
            >
              N
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
