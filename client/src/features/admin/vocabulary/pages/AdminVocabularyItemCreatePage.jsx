import { Link, useNavigate, useParams } from "react-router-dom";
import VocabularyItemForm, {
  defaultVocabularyItemValues,
} from "../components/VocabularyItemForm.jsx";
import { useCreateVocabularyItem } from "../hooks/useAdminVocabulary.js";

export default function AdminVocabularyItemCreatePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const createMutation = useCreateVocabularyItem();

  async function handleSubmit(values) {
    await createMutation.mutateAsync({ courseId, data: values });
    navigate(`/admin/vocabulary-courses/${courseId}/items`);
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Add Vocabulary Item</h1>
        <Link
          className="mt-2 inline-block text-sm font-bold underline"
          to={`/admin/vocabulary-courses/${courseId}/items`}
        >
          Cancel
        </Link>
      </div>
      <div className="max-w-4xl rounded-xl bg-white/70 p-6">
        <VocabularyItemForm
          defaultValues={defaultVocabularyItemValues}
          isSubmitting={createMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel="Create word"
        />
      </div>
    </section>
  );
}
