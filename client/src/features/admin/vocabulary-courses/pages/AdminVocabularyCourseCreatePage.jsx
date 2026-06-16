import { Link, useNavigate } from "react-router-dom";
import VocabularyCourseForm, {
  defaultVocabularyCourseValues,
} from "../components/VocabularyCourseForm.jsx";
import { useCreateAdminVocabularyCourse } from "../hooks/useAdminVocabularyCourses.js";

export default function AdminVocabularyCourseCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAdminVocabularyCourse();

  async function handleSubmit(values) {
    await createMutation.mutateAsync(values);
    navigate("/admin/vocabulary-courses");
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Create Vocabulary Course</h1>
        <Link className="mt-2 inline-block text-sm font-bold underline" to="/admin/vocabulary-courses">
          Cancel
        </Link>
      </div>
      <div className="max-w-3xl rounded-xl bg-white/70 p-6">
        <VocabularyCourseForm
          defaultValues={defaultVocabularyCourseValues}
          isSubmitting={createMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel="Create course"
        />
      </div>
    </section>
  );
}
