import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VocabularyCourseTable from "../components/VocabularyCourseTable.jsx";
import {
  useAdminVocabularyCourses,
  useDeleteAdminVocabularyCourse,
  useTogglePublishAdminVocabularyCourse,
} from "../hooks/useAdminVocabularyCourses.js";

export default function AdminVocabularyCourseListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [isPublished, setIsPublished] = useState("");
  const params = useMemo(
    () => ({
      search: search || undefined,
      level: level || undefined,
      isPublished: isPublished || undefined,
      page: 1,
      limit: 20,
      sort: "order",
    }),
    [isPublished, level, search],
  );
  const { data, error, isLoading } = useAdminVocabularyCourses(params);
  const deleteMutation = useDeleteAdminVocabularyCourse();
  const toggleMutation = useTogglePublishAdminVocabularyCourse();
  const courses = data?.items || [];

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Vocabulary Courses</h1>
          <p className="mt-1 text-sm text-coal/60">Manage TOEIC vocabulary courses.</p>
        </div>
        <button
          className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white"
          onClick={() => navigate("/admin/vocabulary-courses/create")}
          type="button"
        >
          Create Vocabulary Course
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl bg-white/70 p-4 md:grid-cols-3">
        <input
          className="h-11 rounded-lg border border-coal/20 bg-white px-4 text-sm outline-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title"
          value={search}
        />
        <select
          className="h-11 rounded-lg border border-coal/20 bg-white px-4 text-sm outline-none"
          onChange={(event) => setLevel(event.target.value)}
          value={level}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          className="h-11 rounded-lg border border-coal/20 bg-white px-4 text-sm outline-none"
          onChange={(event) => setIsPublished(event.target.value)}
          value={isPublished}
        >
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {isLoading ? <p className="font-semibold">Loading courses...</p> : null}
      {error ? <p className="font-semibold text-red-600">Failed to load courses.</p> : null}
      {!isLoading && !error && courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-coal/20 bg-white/70 p-8 text-center">
          No vocabulary courses yet.
        </div>
      ) : null}
      {courses.length > 0 ? (
        <VocabularyCourseTable
          courses={courses}
          onDelete={(course) => deleteMutation.mutate(course._id)}
          onEdit={(course) => navigate(`/admin/vocabulary-courses/${course._id}/edit`)}
          onManageWords={(course) => navigate(`/admin/vocabulary-courses/${course._id}/items`)}
          onTogglePublish={(course) => toggleMutation.mutate(course._id)}
        />
      ) : null}
    </section>
  );
}
