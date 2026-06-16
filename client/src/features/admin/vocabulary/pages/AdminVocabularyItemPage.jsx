import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import VocabularyItemTable from "../components/VocabularyItemTable.jsx";
import {
  useDeleteVocabularyItem,
  useGenerateAudioForVocabularyCourse,
  useGenerateAudioForVocabularyItem,
  useTogglePublishVocabularyItem,
  useVocabularyItems,
} from "../hooks/useAdminVocabulary.js";

export default function AdminVocabularyItemPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isPublished, setIsPublished] = useState("");
  const params = useMemo(
    () => ({
      search: search || undefined,
      difficulty: difficulty || undefined,
      isPublished: isPublished || undefined,
      page: 1,
      limit: 50,
      sort: "order",
    }),
    [difficulty, isPublished, search],
  );
  const { data, error, isLoading } = useVocabularyItems(courseId, params);
  const deleteMutation = useDeleteVocabularyItem();
  const toggleMutation = useTogglePublishVocabularyItem();
  const generateItemMutation = useGenerateAudioForVocabularyItem();
  const generateCourseMutation = useGenerateAudioForVocabularyCourse();
  const items = data?.items || [];

  async function handleGenerateCourseAudio() {
    if (!window.confirm("Generate audio for all items without audio in this course?")) return;
    await generateCourseMutation.mutateAsync({ courseId, options: { onlyMissing: true } });
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Vocabulary Items</h1>
          <Link className="mt-2 inline-block text-sm font-bold underline" to="/admin/vocabulary-courses">
            Back to vocabulary courses
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-coal/20 px-4 py-2 text-sm font-bold"
            disabled={generateCourseMutation.isPending}
            onClick={handleGenerateCourseAudio}
            type="button"
          >
            {generateCourseMutation.isPending ? "Generating..." : "Generate Missing Audio"}
          </button>
          <button
            className="rounded-lg border border-coal/20 px-4 py-2 text-sm font-bold"
            onClick={() => navigate(`/admin/vocabulary-courses/${courseId}/items/import-json`)}
            type="button"
          >
            Import JSON
          </button>
          <button
            className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white"
            onClick={() => navigate(`/admin/vocabulary-courses/${courseId}/items/create`)}
            type="button"
          >
            Add Word
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl bg-white/70 p-4 md:grid-cols-3">
        <input
          className="h-11 rounded-lg border border-coal/20 bg-white px-4 text-sm outline-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by word or meaning"
          value={search}
        />
        <select
          className="h-11 rounded-lg border border-coal/20 bg-white px-4 text-sm outline-none"
          onChange={(event) => setDifficulty(event.target.value)}
          value={difficulty}
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
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

      {generateCourseMutation.data?.data?.data ? (
        <div className="mb-5 rounded-xl bg-white/75 p-4 text-sm font-semibold">
          Generated: {generateCourseMutation.data.data.data.generatedCount} /{" "}
          {generateCourseMutation.data.data.data.total}
          {generateCourseMutation.data.data.data.failedCount
            ? `, failed: ${generateCourseMutation.data.data.data.failedCount}`
            : ""}
        </div>
      ) : null}
      {isLoading ? <p className="font-semibold">Loading vocabulary items...</p> : null}
      {error ? <p className="font-semibold text-red-600">Failed to load vocabulary items.</p> : null}
      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-coal/20 bg-white/70 p-8 text-center">
          No vocabulary items yet.
        </div>
      ) : null}
      {items.length > 0 ? (
        <VocabularyItemTable
          generatingItemId={generateItemMutation.variables?.itemId}
          items={items}
          onDelete={(item) => deleteMutation.mutate(item._id)}
          onEdit={(item) => navigate(`/admin/vocabulary-items/${item._id}/edit`)}
          onGenerateAudio={(item) => generateItemMutation.mutate({ itemId: item._id })}
          onTogglePublish={(item) => toggleMutation.mutate(item._id)}
        />
      ) : null}
    </section>
  );
}
