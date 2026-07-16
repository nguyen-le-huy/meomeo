import { Course } from "../courses/course.model.js";
import { GeneratedAudio } from "../media/generatedAudio.model.js";
import { uploadAudioBufferToCloudinary } from "../media/media.service.js";
import { generateSpeechAudioBuffer } from "../media/openaiTts.service.js";
import { generateElevenLabsAudioBuffer } from "../media/elevenLabsTts.service.js";
import { VocabularyItem } from "./vocabulary.model.js";
import { VocabularyExercise } from "./vocabularyExercise.model.js";
import { generateVocabularyDetails, generateVocabularyExerciseContent } from "./vocabularyAi.service.js";
import { config } from "../../config/env.js";
import { createHttpError } from "../../utils/createHttpError.js";

export async function getHealth() {
  return { module: "vocabulary", status: "ok" };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertVocabularyCourse(courseId) {
  const course = await Course.findOne({ _id: courseId, type: "vocabulary" });

  if (!course) {
    throw createHttpError(404, "Vocabulary course not found");
  }

  return course;
}

function normalizeItem(data, adminUser, courseId) {
  return {
    courseId,
    word: data.word?.trim(),
    phonetic: data.phonetic || "",
    partOfSpeech: data.partOfSpeech || "other",
    meaningVi: data.meaningVi?.trim(),
    meaningEn: data.meaningEn || "",
    example: data.example || "",
    exampleMeaningVi: data.exampleMeaningVi || "",
    collocations: data.collocations || [],
    imageUrl: data.imageUrl || "",
    audioUrl: data.audioUrl || "",
    audioProvider: data.audioProvider || (data.audioUrl ? "manual" : ""),
    exampleAudioUrl: data.exampleAudioUrl || "",
    exampleAudioProvider: data.exampleAudioProvider || (data.exampleAudioUrl ? "manual" : ""),
    generatedByAi: data.generatedByAi ?? false,
    order: data.order ?? 0,
    difficulty: data.difficulty || "easy",
    isPublished: data.isPublished ?? true,
    createdBy: adminUser.id,
  };
}

export async function createVocabularyItem(courseId, data, adminUser) {
  await assertVocabularyCourse(courseId);
  return VocabularyItem.create(normalizeItem(data, adminUser, courseId));
}

export async function getVocabularyItemsByCourse(courseId, query = {}, options = {}) {
  const course = await assertVocabularyCourse(courseId);
  const page = query.page || 1;
  const limit = query.limit || 20;
  const filter = { courseId };

  if (options.publishedOnly) {
    filter.isPublished = true;
  } else if (typeof query.isPublished === "boolean") {
    filter.isPublished = query.isPublished;
  }

  if (query.search) {
    const search = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [{ word: search }, { meaningVi: search }, { meaningEn: search }];
  }

  if (query.partOfSpeech) filter.partOfSpeech = query.partOfSpeech;
  if (query.difficulty) filter.difficulty = query.difficulty;

  const sort = { [query.sort || "order"]: query.sort === "createdAt" ? -1 : 1 };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    VocabularyItem.find(filter).sort(sort).skip(skip).limit(limit),
    VocabularyItem.countDocuments(filter),
  ]);

  return {
    course,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getVocabularyItemById(itemId) {
  const item = await VocabularyItem.findById(itemId);

  if (!item) {
    throw createHttpError(404, "Vocabulary item not found");
  }

  return item;
}

export async function updateVocabularyItem(itemId, data) {
  const item = await getVocabularyItemById(itemId);

  for (const [key, value] of Object.entries(data)) {
    item[key] = value;
  }

  await item.save();
  return item;
}

export async function deleteVocabularyItem(itemId) {
  const item = await getVocabularyItemById(itemId);
  await item.deleteOne();
  return { id: itemId };
}

export async function togglePublishVocabularyItem(itemId) {
  const item = await getVocabularyItemById(itemId);
  item.isPublished = !item.isPublished;
  await item.save();
  return item;
}

async function generateAudioForText(text, options = {}) {
  const provider = options.provider || "openai";
  const audioBuffer = provider === "elevenlabs"
    ? await generateElevenLabsAudioBuffer(text, options.elevenLabs || {})
    : await generateSpeechAudioBuffer(text, options);
  const timestamp = Date.now();
  const uploadedAudio = await uploadAudioBufferToCloudinary(audioBuffer, {
    publicId: `${options.publicIdPrefix || "vocabulary-audio"}-${timestamp}`,
  });

  if (options.relatedModel && options.relatedId) {
    await GeneratedAudio.create({
      text,
      voice: provider === "elevenlabs" ? options.elevenLabs?.voiceId : options.voice || config.openAi.ttsVoice,
      provider,
      audioUrl: uploadedAudio.secureUrl,
      publicId: uploadedAudio.publicId,
      type: options.type || "sentence",
      relatedModel: options.relatedModel,
      relatedId: options.relatedId,
    });
  }

  return uploadedAudio;
}

export async function bulkImportVocabularyItems(courseId, items, adminUser) {
  await assertVocabularyCourse(courseId);
  const existingItems = await VocabularyItem.find({ courseId }).select("word");
  const existingWords = new Set(existingItems.map((item) => item.word.toLowerCase()));
  const seenWords = new Set();
  const itemsToCreate = [];
  const skippedItems = [];

  for (const item of items) {
    const word = item.word?.trim();
    const lowerWord = word?.toLowerCase();

    if (!word) {
      skippedItems.push({ word: "", reason: "Word is empty" });
      continue;
    }

    if (existingWords.has(lowerWord) || seenWords.has(lowerWord)) {
      skippedItems.push({ word, reason: "Duplicate word in course" });
      continue;
    }

    seenWords.add(lowerWord);
    itemsToCreate.push(normalizeItem({ ...item, word }, adminUser, courseId));
  }

  const createdItems = itemsToCreate.length ? await VocabularyItem.insertMany(itemsToCreate) : [];

  return {
    totalInput: items.length,
    createdCount: createdItems.length,
    skippedCount: skippedItems.length,
    createdItems,
    skippedItems,
  };
}

export async function generateAudioForVocabularyItem(itemId, options = {}) {
  const item = await getVocabularyItemById(itemId);
  const includeExample = options.includeExample ?? true;

  if (item.audioUrl && (!includeExample || item.exampleAudioUrl || !item.example) && !options.force) {
    return {
      item,
      audio: {
        audioUrl: item.audioUrl,
        publicId: item.audioPublicId,
        provider: item.audioProvider || "openai",
        voice: options.voice || config.openAi.ttsVoice,
      },
      skipped: true,
    };
  }

  const provider = options.provider || "openai";
  let uploadedAudio = item.audioUrl ? { secureUrl: item.audioUrl, publicId: item.audioPublicId } : null;
  let uploadedExampleAudio = item.exampleAudioUrl ? { secureUrl: item.exampleAudioUrl, publicId: item.exampleAudioPublicId } : null;

  if (!item.audioUrl || options.force) {
    uploadedAudio = await generateAudioForText(item.word, {
      ...options,
      provider,
      publicIdPrefix: `vocabulary-${item._id}-word`,
      type: "word",
      relatedModel: "VocabularyItem",
      relatedId: item._id,
    });

    item.audioUrl = uploadedAudio.secureUrl;
    item.audioPublicId = uploadedAudio.publicId;
    item.audioProvider = provider;
  }

  if (includeExample && item.example && (!item.exampleAudioUrl || options.force)) {
    uploadedExampleAudio = await generateAudioForText(item.example, {
      ...options,
      provider,
      publicIdPrefix: `vocabulary-${item._id}-example`,
      type: "sentence",
      relatedModel: "VocabularyItem",
      relatedId: item._id,
    });

    item.exampleAudioUrl = uploadedExampleAudio.secureUrl;
    item.exampleAudioPublicId = uploadedExampleAudio.publicId;
    item.exampleAudioProvider = provider;
  }

  await item.save();

  return {
    item,
    audio: {
      audioUrl: uploadedAudio?.secureUrl || "",
      publicId: uploadedAudio?.publicId || "",
      provider,
      voice: provider === "elevenlabs" ? options.elevenLabs?.voiceId : options.voice || config.openAi.ttsVoice,
    },
    exampleAudio: uploadedExampleAudio ? {
      audioUrl: uploadedExampleAudio.secureUrl,
      publicId: uploadedExampleAudio.publicId,
      provider,
      voice: provider === "elevenlabs" ? options.elevenLabs?.voiceId : options.voice || config.openAi.ttsVoice,
    } : null,
  };
}

export async function generateAudioForVocabularyCourse(courseId, options = {}) {
  await assertVocabularyCourse(courseId);
  const limit = options.limit || 100;
  const missingAudioFilter = options.includeExample === false
    ? { $or: [{ audioUrl: "" }, { audioUrl: { $exists: false } }] }
    : {
        $or: [
          { audioUrl: "" },
          { audioUrl: { $exists: false } },
          { example: { $ne: "" }, exampleAudioUrl: "" },
          { example: { $ne: "" }, exampleAudioUrl: { $exists: false } },
        ],
      };
  const filter = {
    courseId,
    ...(options.force ? {} : missingAudioFilter),
  };
  const items = await VocabularyItem.find(filter).sort({ order: 1 }).limit(limit);
  const generatedItems = [];
  const skippedItems = [];
  const failedItems = [];

  for (const item of items) {
    try {
      const result = await generateAudioForVocabularyItem(item._id, options);

      if (result.skipped) {
        skippedItems.push({ id: item._id, word: item.word });
      } else {
        generatedItems.push({ id: result.item._id, word: result.item.word, audioUrl: result.item.audioUrl, exampleAudioUrl: result.item.exampleAudioUrl });
      }
    } catch (error) {
      failedItems.push({ id: item._id, word: item.word, reason: error.message });
    }
  }

  return {
    total: items.length,
    generatedCount: generatedItems.length,
    skippedCount: skippedItems.length,
    failedCount: failedItems.length,
    generatedItems,
    skippedItems,
    failedItems,
  };
}

export async function generateVocabularyCourseWithAi(courseId, data, adminUser) {
  const course = await assertVocabularyCourse(courseId);
  const generated = await generateVocabularyDetails(data.words, course);
  const importResult = await bulkImportVocabularyItems(
    courseId,
    generated.items.map((item, index) => ({
      ...item,
      order: data.startOrder + index,
      generatedByAi: true,
      isPublished: data.isPublished,
    })),
    adminUser,
  );

  const audioResults = [];
  if (data.generateAudio) {
    for (const item of importResult.createdItems) {
      try {
        const result = await generateAudioForVocabularyItem(item._id, {
          provider: data.audioProvider,
          voice: data.openAiVoice,
          elevenLabs: data.elevenLabs,
        });
        audioResults.push({ id: item._id, word: item.word, status: "generated", audioUrl: result.item.audioUrl, exampleAudioUrl: result.item.exampleAudioUrl });
      } catch (error) {
        audioResults.push({ id: item._id, word: item.word, status: "failed", reason: error.message });
      }
    }
  }

  return { ...importResult, audioResults };
}

export async function getVocabularyExercises(courseId, options = {}) {
  await assertVocabularyCourse(courseId);
  return VocabularyExercise.find({ courseId, ...(options.publishedOnly ? { isPublished: true } : {}) }).sort({ lessonKey: 1 });
}

export async function upsertVocabularyExercise(courseId, lessonKey, data, adminUser) {
  await assertVocabularyCourse(courseId);
  return VocabularyExercise.findOneAndUpdate(
    { courseId, lessonKey },
    {
      $set: {
        title: data.title,
        instructions: data.instructions || "",
        questions: data.questions || [],
        settings: data.settings || {},
        generatedByAi: data.generatedByAi ?? false,
        isPublished: data.isPublished ?? true,
      },
      $setOnInsert: { createdBy: adminUser.id },
    },
    { new: true, upsert: true, runValidators: true },
  );
}

export async function deleteVocabularyExercise(courseId, lessonKey) {
  await assertVocabularyCourse(courseId);
  await VocabularyExercise.deleteOne({ courseId, lessonKey });
  return { lessonKey };
}

export async function generateVocabularyExerciseWithAi(courseId, lessonKey, data, adminUser) {
  const course = await assertVocabularyCourse(courseId);
  const items = await VocabularyItem.find({ courseId, isPublished: true }).sort({ order: 1 });
  if (!items.length) throw createHttpError(400, "Create vocabulary flashcards before generating exercises");

  const flashcardCount = items.length;

  const questions = await generateVocabularyExerciseContent({
    course,
    items,
    lessonKey,
    questionCount: flashcardCount,
  });

  if (lessonKey === "cloze-quiz") {
    const provider = data.audioProvider || "openai";

    for (const [index, question] of questions.entries()) {
      if (!question.prompt) continue;

      try {
        const uploadedAudio = await generateAudioForText(question.prompt, {
          provider,
          voice: data.openAiVoice,
          elevenLabs: data.elevenLabs,
          publicIdPrefix: `vocabulary-exercise-${courseId}-${lessonKey}-${index + 1}`,
          type: "sentence",
          relatedModel: "VocabularyExercise",
          relatedId: courseId,
        });

        question.audioUrl = uploadedAudio.secureUrl;
        question.audioPublicId = uploadedAudio.publicId;
        question.audioProvider = provider;
      } catch (error) {
        question.audioError = error.message;
      }
    }
  }

  const lesson = course.lessons.find((item) => item.key === lessonKey);

  return upsertVocabularyExercise(
    courseId,
    lessonKey,
    {
      title: data.title || lesson?.title || "Bài luyện tập",
      instructions: data.instructions || lesson?.description || "",
      questions,
      settings: { ...(data.settings || {}), flashcardCount },
      generatedByAi: true,
      isPublished: data.isPublished,
    },
    adminUser,
  );
}
