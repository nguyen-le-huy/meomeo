import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import VocabularyJsonImportForm from "../components/VocabularyJsonImportForm.jsx";
import VocabularyPromptBox from "../components/VocabularyPromptBox.jsx";
import { useBulkImportVocabularyItems } from "../hooks/useAdminVocabulary.js";

const sampleText = `[
  {
    "word": "annual",
    "phonetic": "/ˈæn.ju.əl/",
    "partOfSpeech": "adjective",
    "meaningVi": "hằng năm",
    "meaningEn": "happening once every year",
    "example": "The annual meeting will be held next Monday.",
    "exampleMeaningVi": "Cuộc họp hằng năm sẽ được tổ chức vào thứ Hai tới.",
    "imageUrl": "",
    "order": 1,
    "difficulty": "easy"
  }
]`;

export default function AdminVocabularyImportJsonPage() {
  const { courseId } = useParams();
  const [jsonText, setJsonText] = useState(sampleText);
  const [validItems, setValidItems] = useState(null);
  const [parseError, setParseError] = useState("");
  const importMutation = useBulkImportVocabularyItems();
  const importResult = importMutation.data?.data?.data || null;

  function validateJson() {
    setParseError("");
    setValidItems(null);

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setParseError("JSON must be an array of vocabulary items.");
        return;
      }
      if (parsed.length === 0) {
        setParseError("JSON array is empty.");
        return;
      }
      setValidItems(parsed);
    } catch {
      setParseError("Invalid JSON format.");
    }
  }

  async function handleImport() {
    const items = validItems || JSON.parse(jsonText);
    await importMutation.mutateAsync({ courseId, items });
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black">Import Vocabulary JSON</h1>
        <Link
          className="mt-2 inline-block text-sm font-bold underline"
          to={`/admin/vocabulary-courses/${courseId}/items`}
        >
          Back to vocabulary items
        </Link>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
        <VocabularyJsonImportForm
          error={parseError || importMutation.error?.response?.data?.message}
          importResult={importResult}
          isImporting={importMutation.isPending}
          jsonText={jsonText}
          onImport={handleImport}
          onJsonTextChange={(value) => {
            setJsonText(value);
            setValidItems(null);
            setParseError("");
          }}
          onValidate={validateJson}
          previewItems={(validItems || []).slice(0, 10)}
          validItems={validItems}
        />
        <VocabularyPromptBox />
      </div>
    </section>
  );
}
