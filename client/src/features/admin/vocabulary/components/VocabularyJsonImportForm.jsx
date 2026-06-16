export default function VocabularyJsonImportForm({
  error,
  importResult,
  isImporting,
  jsonText,
  onImport,
  onJsonTextChange,
  onValidate,
  previewItems,
  validItems,
}) {
  return (
    <div className="rounded-xl bg-white/75 p-4">
      <textarea
        className="min-h-72 w-full rounded-lg border border-coal/20 bg-white/80 p-4 font-mono text-sm outline-none focus:border-coal"
        onChange={(event) => onJsonTextChange(event.target.value)}
        placeholder="Paste JSON array here"
        value={jsonText}
      />
      {error ? <p className="mt-3 font-semibold text-red-600">{error}</p> : null}
      {validItems ? <p className="mt-3 font-semibold">Valid items: {validItems.length}</p> : null}
      {previewItems.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-sm">
          {previewItems.map((item, index) => (
            <li key={`${item.word}-${index}`}>
              {item.word} - {item.meaningVi}
            </li>
          ))}
        </ul>
      ) : null}
      {importResult ? (
        <div className="mt-3 rounded-lg bg-matcha/60 p-3 text-sm">
          <p>Total input: {importResult.totalInput}</p>
          <p>Created: {importResult.createdCount}</p>
          <p>Skipped: {importResult.skippedCount}</p>
        </div>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button className="rounded-lg border border-coal/20 px-4 py-2 font-bold" onClick={onValidate}>
          Validate JSON
        </button>
        <button
          className="rounded-lg bg-black px-4 py-2 font-bold text-white disabled:opacity-60"
          disabled={!validItems || isImporting}
          onClick={onImport}
        >
          {isImporting ? "Importing..." : "Import Vocabulary"}
        </button>
      </div>
    </div>
  );
}
