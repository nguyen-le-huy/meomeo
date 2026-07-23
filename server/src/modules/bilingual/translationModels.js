export const TRANSLATION_MODELS = {
  "deepseek-v4-flash": {
    label: "DeepSeek V4 Flash",
    provider: "deepseek",
  },
  "deepseek-v4-pro": {
    label: "DeepSeek V4 Pro",
    provider: "deepseek",
  },
  "gpt-5.4-mini": {
    label: "GPT-5.4 mini",
    provider: "openai",
  },
  "gpt-5-mini": {
    label: "GPT-5 mini",
    provider: "openai",
  },
};

export const TRANSLATION_MODEL_IDS = Object.freeze(Object.keys(TRANSLATION_MODELS));

export function getTranslationModel(modelId) {
  return TRANSLATION_MODELS[modelId] || null;
}
