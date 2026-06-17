export default function DictationResult({ result }) {
  return (
    <div className="rounded-lg bg-matcha/70 p-3 text-sm font-bold">
      <p>Score: {result.score}</p>
      <p>{result.isCorrect ? "Đúng rồi." : "Chưa đúng."}</p>
      <p>Correct: {result.correctText}</p>
      {result.mistakes?.length ? <p>Mistakes: {result.mistakes.length}</p> : null}
    </div>
  );
}
