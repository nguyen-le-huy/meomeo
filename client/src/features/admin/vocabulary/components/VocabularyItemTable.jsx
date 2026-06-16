export default function VocabularyItemTable({
  generatingItemId,
  items,
  onDelete,
  onEdit,
  onGenerateAudio,
  onTogglePublish,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-coal/10 bg-white/80">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-matcha/60 text-xs uppercase text-coal/60">
          <tr>
            <th className="px-4 py-3">Word</th>
            <th className="px-4 py-3">Phonetic</th>
            <th className="px-4 py-3">POS</th>
            <th className="px-4 py-3">Meaning VI</th>
            <th className="px-4 py-3">Difficulty</th>
            <th className="px-4 py-3">Audio</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-t border-coal/10" key={item._id}>
              <td className="px-4 py-3 font-bold">{item.word}</td>
              <td className="px-4 py-3">{item.phonetic || "-"}</td>
              <td className="px-4 py-3">{item.partOfSpeech}</td>
              <td className="px-4 py-3">{item.meaningVi}</td>
              <td className="px-4 py-3">{item.difficulty}</td>
              <td className="px-4 py-3">
                {item.audioUrl ? (
                  <div className="space-y-1">
                    <span className="font-semibold">Has audio</span>
                    <audio className="w-36" controls src={item.audioUrl} />
                  </div>
                ) : (
                  "No audio"
                )}
              </td>
              <td className="px-4 py-3">{item.order}</td>
              <td className="px-4 py-3">{item.isPublished ? "Published" : "Draft"}</td>
              <td className="space-x-2 px-4 py-3">
                <button className="font-bold underline" onClick={() => onEdit(item)}>
                  Edit
                </button>
                <button className="font-bold underline" onClick={() => onTogglePublish(item)}>
                  {item.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="font-bold underline"
                  disabled={generatingItemId === item._id}
                  onClick={() => onGenerateAudio(item)}
                >
                  {generatingItemId === item._id ? "Generating..." : "Generate Audio"}
                </button>
                <button
                  className="font-bold text-red-600 underline"
                  onClick={() => {
                    if (window.confirm("Delete this vocabulary item?")) onDelete(item);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
