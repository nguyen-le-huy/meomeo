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

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-matcha text-coal">
      <aside className="flex w-[190px] shrink-0 flex-col border-r border-coal/15 bg-white/90 px-3 py-4 shadow-sm">
        <NavLink className="mb-5 flex items-center gap-2 px-1 text-sm font-bold" to="/dashboard">
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
              to={link.to}
            >
              <span className="w-5 text-center text-sm">{link.icon}</span>
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
              to="/admin"
            >
              <span className="w-5 text-center text-sm">A</span>
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
            onClick={handleLogout}
            type="button"
          >
            Dang xuat
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
