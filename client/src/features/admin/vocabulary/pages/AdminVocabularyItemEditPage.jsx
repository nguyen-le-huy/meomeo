import { Link, useNavigate, useParams } from "react-router-dom";
import VocabularyItemForm from "../components/VocabularyItemForm.jsx";
import { useUpdateVocabularyItem, useVocabularyItem } from "../hooks/useAdminVocabulary.js";

export default function AdminVocabularyItemEditPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { data: item, error, isLoading } = useVocabularyItem(itemId);
  const updateMutation = useUpdateVocabularyItem();

  async function handleSubmit(values) {
    await updateMutation.mutateAsync({ itemId, data: values });
    navigate(`/admin/vocabulary-courses/${item.courseId}/items`);
  }

  if (isLoading) {
    return <p className="p-6 font-semibold">Loading vocabulary item...</p>;
  }

  if (error || !item) {
    return <p className="p-6 font-semibold text-red-600">Vocabulary item not found.</p>;
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Edit Vocabulary Item</h1>
        <Link
          className="mt-2 inline-block text-sm font-bold underline"
          to={`/admin/vocabulary-courses/${item.courseId}/items`}
        >
          Cancel
        </Link>
      </div>
      <div className="max-w-4xl rounded-xl bg-white/70 p-6">
        <VocabularyItemForm
          defaultValues={{
            word: item.word || "",
            phonetic: item.phonetic || "",
            partOfSpeech: item.partOfSpeech || "other",
            meaningVi: item.meaningVi || "",
            meaningEn: item.meaningEn || "",
            example: item.example || "",
            exampleMeaningVi: item.exampleMeaningVi || "",
            imageUrl: item.imageUrl || "",
            audioUrl: item.audioUrl || "",
            order: item.order || 0,
            difficulty: item.difficulty || "easy",
            isPublished: Boolean(item.isPublished),
          }}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmit}
          submitLabel="Update word"
        />
      </div>
    </section>
  );
}
