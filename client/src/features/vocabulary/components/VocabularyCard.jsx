export default function VocabularyCard({ word, meaningVi }) {
  return (
    <article className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">{word}</h2>
      <p className="text-sm text-coal/65">{meaningVi}</p>
    </article>
  );
}
