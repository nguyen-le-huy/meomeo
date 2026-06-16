import { useState } from "react";
import { vocabularyJsonPrompt } from "../constants/vocabularyJsonPrompt.js";

export default function VocabularyPromptBox() {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(vocabularyJsonPrompt.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-xl bg-white/75 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-black">Prompt mẫu cho ChatGPT</h2>
        <button className="rounded-lg bg-black px-3 py-2 text-sm font-bold text-white" onClick={copyPrompt}>
          {copied ? "Copied" : "Copy Prompt"}
        </button>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-matcha/50 p-3 text-xs">
        {vocabularyJsonPrompt.trim()}
      </pre>
    </div>
  );
}
