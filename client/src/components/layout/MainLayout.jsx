import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/grammar", label: "Grammar" },
  { to: "/exercises", label: "Exercises" },
  { to: "/speech", label: "Speech" },
  { to: "/admin", label: "Admin" },
];

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <NavLink className="font-semibold" to="/dashboard">
            Meomeo TOEIC
          </NavLink>
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
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
