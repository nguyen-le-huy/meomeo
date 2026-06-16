import { Link, useNavigate, useParams } from "react-router-dom";
import VocabularyCourseForm from "../components/VocabularyCourseForm.jsx";
import {
  useAdminVocabularyCourse,
  useUpdateAdminVocabularyCourse,
} from "../hooks/useAdminVocabularyCourses.js";

export default function AdminVocabularyCourseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: course, error, isLoading } = useAdminVocabularyCourse(id);
  const updateMutation = useUpdateAdminVocabularyCourse();

  async function handleSubmit(values) {
    await updateMutation.mutateAsync({ id, data: values });
    navigate("/admin/vocabulary-courses");
  }

  if (isLoading) {
    return <p className="p-6 font-semibold">Loading course...</p>;
  }

  if (error || !course) {
    return <p className="p-6 font-semibold text-red-600">Course not found.</p>;
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Edit Vocabulary Course</h1>
        <Link className="mt-2 inline-block text-sm font-bold underline" to="/admin/vocabulary-courses">
          Cancel
        </Link>
      </div>
      <div className="max-w-3xl rounded-xl bg-white/70 p-6">
        <VocabularyCourseForm
          defaultValues={{
            title: course.title || "",
            description: course.description || "",
            thumbnailUrl: course.thumbnailUrl || "",
            level: course.level || "beginner",
            order: course.order || 0,
            isPublished: Boolean(course.isPublished),
          }}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel="Update course"
        />
      </div>
    </section>
  );
}
