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
    <div className="min-h-screen bg-matcha text-coal">
      <header className="border-b border-coal/10 bg-white/85">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <NavLink className="font-semibold" to="/dashboard">
            Meomeo TOEIC
          </NavLink>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-3 text-sm">
              {links.map((link) => (
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "font-medium text-coal" : "text-coal/60 hover:text-coal"
                  }
                  key={link.to}
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {user ? <span className="text-coal/60">{user.name}</span> : null}
              <button
                className="rounded-md border border-coal/20 px-3 py-1.5 font-medium text-coal hover:bg-matcha/50"
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
