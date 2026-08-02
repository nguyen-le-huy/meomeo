export const DICTIONARY_MODELS = Object.freeze([
  { id: "gpt-5.6-luna", label: "gpt-5.6-luna" },
  { id: "gpt-5.4-mini-2026-03-17", label: "gpt-5.4-mini-2026-03-17" },
]);

export const DEFAULT_DICTIONARY_MODEL = "gpt-5.4-mini-2026-03-17";
export const DICTIONARY_MODEL_STORAGE_KEY = "dictionary-translation-model";

export function getStoredDictionaryModel() {
  const storedModel = window.localStorage.getItem(DICTIONARY_MODEL_STORAGE_KEY);
  return DICTIONARY_MODELS.some((model) => model.id === storedModel)
    ? storedModel
    : DEFAULT_DICTIONARY_MODEL;
}
