import { Course } from "../courses/course.model.js";
import { GeneratedAudio } from "../media/generatedAudio.model.js";
import { uploadAudioBufferToCloudinary } from "../media/media.service.js";
import { generateSpeechAudioBuffer } from "../media/openaiTts.service.js";
import { VocabularyItem } from "./vocabulary.model.js";
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
    imageUrl: data.imageUrl || "",
    audioUrl: data.audioUrl || "",
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

  if (item.audioUrl && !options.force) {
    return {
      item,
      audio: {
        audioUrl: item.audioUrl,
        publicId: item.audioPublicId,
        provider: "openai",
        voice: options.voice || config.openAi.ttsVoice,
      },
      skipped: true,
    };
  }

  const audioBuffer = await generateSpeechAudioBuffer(item.word, options);
  const timestamp = Date.now();
  const uploadedAudio = await uploadAudioBufferToCloudinary(audioBuffer, {
    publicId: `vocabulary-${item._id}-${timestamp}`,
  });

  item.audioUrl = uploadedAudio.secureUrl;
  item.audioPublicId = uploadedAudio.publicId;
  await item.save();

  await GeneratedAudio.create({
    text: item.word,
    voice: options.voice || config.openAi.ttsVoice,
    provider: "openai",
    audioUrl: uploadedAudio.secureUrl,
    publicId: uploadedAudio.publicId,
    type: "word",
    relatedModel: "VocabularyItem",
    relatedId: item._id,
  });

  return {
    item,
    audio: {
      audioUrl: uploadedAudio.secureUrl,
      publicId: uploadedAudio.publicId,
      provider: "openai",
      voice: options.voice || config.openAi.ttsVoice,
    },
  };
}

export async function generateAudioForVocabularyCourse(courseId, options = {}) {
  await assertVocabularyCourse(courseId);
  const limit = options.limit || 100;
  const filter = {
    courseId,
    ...(options.force ? {} : { $or: [{ audioUrl: "" }, { audioUrl: { $exists: false } }] }),
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
        generatedItems.push({ id: result.item._id, word: result.item.word, audioUrl: result.item.audioUrl });
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
