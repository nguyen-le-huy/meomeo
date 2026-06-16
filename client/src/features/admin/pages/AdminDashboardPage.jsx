import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  return (
    <section className="h-full overflow-auto p-6">
      <h1 className="text-3xl font-black">Admin Dashboard</h1>
      <div className="mt-6 rounded-xl bg-white/70 p-6">
        <Link className="text-lg font-bold underline" to="/admin/vocabulary-courses">
          Manage Vocabulary Courses
        </Link>
      </div>
    </section>
  );
}
