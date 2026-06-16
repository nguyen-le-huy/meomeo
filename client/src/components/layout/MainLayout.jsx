import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/stores/authStore.js";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/grammar", label: "Grammar" },
  { to: "/exercises", label: "Exercises" },
  { to: "/speech", label: "Speech" },
  { to: "/admin", label: "Admin" },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <NavLink className="font-semibold" to="/dashboard">
            Meomeo TOEIC
          </NavLink>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-3 text-sm">
              {links.map((link) => (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "font-medium text-slate-950" : "text-slate-600 hover:text-slate-950"
                  }
                  key={link.to}
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {user ? <span className="text-slate-500">{user.name}</span> : null}
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
