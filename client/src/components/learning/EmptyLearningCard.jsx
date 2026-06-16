export default function EmptyLearningCard({ title = "No content yet" }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-600">
      {title}
    </div>
  );
}
