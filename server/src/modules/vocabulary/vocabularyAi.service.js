import OpenAI from "openai";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

function getOpenAi() {
  if (!config.openAi.apiKey) throw createHttpError(500, "OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: config.openAi.apiKey });
}

async function createStructuredCompletion({ name, prompt, schema }) {
  const response = await getOpenAi().chat.completions.create({
    model: config.openAi.vocabularyModel,
    messages: [
      {
        role: "system",
        content:
          "You create accurate English learning material for Vietnamese learners. Use natural modern English, concise Vietnamese, IPA pronunciation, and practical A1-B2 examples. Return only data matching the JSON schema.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name, strict: true, schema },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw createHttpError(502, "OpenAI returned an empty response");

  try {
    return JSON.parse(content);
  } catch {
    throw createHttpError(502, "OpenAI returned invalid structured data");
  }
}

const vocabularyItemProperties = {
  word: { type: "string" },
  phonetic: { type: "string" },
  partOfSpeech: {
    type: "string",
    enum: ["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "phrase", "other"],
  },
  meaningVi: { type: "string" },
  meaningEn: { type: "string" },
  example: { type: "string" },
  exampleMeaningVi: { type: "string" },
  collocations: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
};

export async function generateVocabularyDetails(words, context = {}) {
  return createStructuredCompletion({
    name: "vocabulary_flashcards",
    prompt: `Create one flashcard for every input item, preserving the input order and exact headword or phrase. Course: ${context.title || "General English"}. Description: ${context.description || ""}. Input: ${JSON.stringify(words)}`,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          minItems: words.length,
          maxItems: words.length,
          items: {
            type: "object",
            additionalProperties: false,
            properties: vocabularyItemProperties,
            required: Object.keys(vocabularyItemProperties),
          },
        },
      },
      required: ["items"],
    },
  });
}

const exerciseQuestionProperties = {
  prompt: { type: "string" },
  answer: { type: "string" },
  translation: { type: "string" },
  sentence: { type: "string" },
  options: { type: "array", items: { type: "string" } },
};

export async function generateVocabularyExerciseContent({ course, items, lessonKey, questionCount }) {
  const lessonPrompts = {
    "match-meaning": "Create English-Vietnamese matching rounds. Each question is one English item and its Vietnamese answer; options contain plausible Vietnamese choices.",
    "listening-fill": "Create full sentence reconstruction questions alternating translation direction. Use each source flashcard's example and exampleMeaningVi only; do not use the isolated vocabulary word or meaning as the answer. For Việt → Anh: prompt is exampleMeaningVi and answer is example. For Anh → Việt: prompt is example and answer is exampleMeaningVi. prompt must contain only the source sentence the learner sees, with no instruction text, no labels, no arrows, and no text like 'Reconstruct the sentence'. translation describes the direction as 'Việt → Anh' or 'Anh → Việt'. options are shuffled answer sentence tokens plus at most two same-language distractors.",
    "cloze-quiz": "Create listening cloze questions with NEW natural English sentences. Use each flashcard example only as context for meaning and level; do not copy or lightly rewrite the example sentence. prompt is the complete new spoken English sentence containing the target word or phrase naturally. sentence is the same sentence with exactly one ___ blank replacing the target word or phrase. answer is the missing target word or phrase. translation is a Vietnamese translation of the new prompt. options may be empty.",
  };

  const flashcardSource = items.map((item) => ({
    word: item.word,
    meaningVi: item.meaningVi,
    example: item.example,
    exampleMeaningVi: item.exampleMeaningVi,
    collocations: item.collocations || [],
  }));
  const selectedSource = Array.from(
    { length: questionCount },
    (_, index) => flashcardSource[index % flashcardSource.length],
  );
  const batchSize = 30;
  const questions = [];

  for (let start = 0; start < selectedSource.length; start += batchSize) {
    const batch = selectedSource.slice(start, start + batchSize);
    const result = await createStructuredCompletion({
      name: `vocabulary_exercise_${lessonKey.replaceAll("-", "_")}`,
      prompt: `${lessonPrompts[lessonKey]} Course: ${course.title}. Create exactly one question for each source flashcard and preserve source order. ${lessonKey === "listening-fill" ? "The target learning item is the full example sentence, not the vocabulary headword." : "Make the source word the target learning item."} ${lessonKey === "cloze-quiz" ? "The new prompt must not equal the flashcard example, and sentence must be the blanked version of that new prompt." : ""} Collocations are supporting context only and must not become additional questions. Source flashcards: ${JSON.stringify(batch)}`,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          questions: {
            type: "array",
            minItems: batch.length,
            maxItems: batch.length,
            items: {
              type: "object",
              additionalProperties: false,
              properties: exerciseQuestionProperties,
              required: Object.keys(exerciseQuestionProperties),
            },
          },
        },
        required: ["questions"],
      },
    });
    questions.push(...result.questions.map((question, index) => normalizeGeneratedQuestion(lessonKey, question, batch[index], start + index)));
  }

  return questions;
}

function normalizeGeneratedQuestion(lessonKey, question, source, index = 0) {
  if (lessonKey === "cloze-quiz") return normalizeClozeQuestion(question, source, index);
  if (lessonKey !== "listening-fill") return question;

  return {
    ...question,
    prompt: stripReconstructionInstruction(question.prompt),
  };
}

function stripReconstructionInstruction(value) {
  const text = String(value || "").trim();
  const match = text.match(/^reconstruct the sentence:\s*(.+?)(?:\s*\(.*?\))?\.?$/i);
  return match ? match[1].trim() : text;
}

function normalizeClozeQuestion(question, source, index) {
  const prompt = String(question.prompt || "").trim();
  const sourceExample = String(source?.example || "").trim();

  if (prompt && prompt.toLowerCase() !== sourceExample.toLowerCase()) return question;

  const templates = [
    `I need to use "${source.word}" in a real conversation today.`,
    `This short sentence helps me remember "${source.word}" clearly.`,
    `Try to say "${source.word}" naturally when you speak English.`,
    `The teacher asked us to practice "${source.word}" after class.`,
  ];
  const fallbackPrompt = templates[index % templates.length];

  return {
    ...question,
    prompt: fallbackPrompt,
    sentence: fallbackPrompt.replace(source.word, "___"),
    answer: source.word,
    translation: `Câu này giúp luyện từ "${source.meaningVi}".`,
  };
}
