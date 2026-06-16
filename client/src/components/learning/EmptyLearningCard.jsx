export default function EmptyLearningCard({ title = "No content yet" }) {
  return (
    <div className="rounded-lg border border-dashed border-coal/25 bg-white/80 p-6 text-coal/65">
      {title}
    </div>
  );
}
