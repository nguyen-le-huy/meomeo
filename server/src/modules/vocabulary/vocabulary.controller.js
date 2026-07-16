import {
  bulkImportVocabularyItems,
  createVocabularyItem,
  deleteVocabularyItem,
  generateAudioForVocabularyCourse,
  generateAudioForVocabularyItem,
  getHealth,
  getVocabularyItemById,
  getVocabularyItemsByCourse,
  togglePublishVocabularyItem,
  updateVocabularyItem,
  generateVocabularyCourseWithAi,
  getVocabularyExercises,
  upsertVocabularyExercise,
  deleteVocabularyExercise,
  generateVocabularyExerciseWithAi,
} from "./vocabulary.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getVocabularyHealth = asyncHandler(async (req, res) => {
  const data = await getHealth();
  return successResponse(res, "Success", data);
});

export const createVocabularyItemController = asyncHandler(async (req, res) => {
  const item = await createVocabularyItem(req.validated.params.courseId, req.validated.body, req.user);
  return successResponse(res, "Vocabulary item created successfully", { item }, 201);
});

export const getVocabularyItemsByCourseController = asyncHandler(async (req, res) => {
  const data = await getVocabularyItemsByCourse(req.validated.params.courseId, req.validated.query);
  return successResponse(res, "Vocabulary items fetched successfully", data);
});

export const getStudentVocabularyItemsByCourseController = asyncHandler(async (req, res) => {
  const data = await getVocabularyItemsByCourse(req.validated.params.courseId, req.validated.query, {
    publishedOnly: true,
  });
  return successResponse(res, "Vocabulary items fetched successfully", data);
});

export const getVocabularyItemDetailController = asyncHandler(async (req, res) => {
  const item = await getVocabularyItemById(req.validated.params.itemId);
  return successResponse(res, "Vocabulary item fetched successfully", { item });
});

export const updateVocabularyItemController = asyncHandler(async (req, res) => {
  const item = await updateVocabularyItem(req.validated.params.itemId, req.validated.body);
  return successResponse(res, "Vocabulary item updated successfully", { item });
});

export const deleteVocabularyItemController = asyncHandler(async (req, res) => {
  const data = await deleteVocabularyItem(req.validated.params.itemId);
  return successResponse(res, "Vocabulary item deleted successfully", data);
});

export const togglePublishVocabularyItemController = asyncHandler(async (req, res) => {
  const item = await togglePublishVocabularyItem(req.validated.params.itemId);
  return successResponse(res, "Vocabulary item publish status updated successfully", { item });
});

export const bulkImportVocabularyItemsController = asyncHandler(async (req, res) => {
  const data = await bulkImportVocabularyItems(
    req.validated.params.courseId,
    req.validated.body.items,
    req.user,
  );
  return successResponse(res, "Vocabulary items imported successfully", data, 201);
});

export const generateAudioForVocabularyItemController = asyncHandler(async (req, res) => {
  const data = await generateAudioForVocabularyItem(req.validated.params.itemId, req.validated.body);
  return successResponse(res, "Vocabulary item audio generated successfully", data);
});

export const generateAudioForVocabularyCourseController = asyncHandler(async (req, res) => {
  const data = await generateAudioForVocabularyCourse(
    req.validated.params.courseId,
    req.validated.body,
  );
  return successResponse(res, "Vocabulary course audio generation completed", data);
});

export const generateVocabularyCourseWithAiController = asyncHandler(async (req, res) => {
  const data = await generateVocabularyCourseWithAi(
    req.validated.params.courseId,
    req.validated.body,
    req.user,
  );
  return successResponse(res, "Vocabulary flashcards generated successfully", data, 201);
});

export const getVocabularyExercisesController = asyncHandler(async (req, res) => {
  const exercises = await getVocabularyExercises(req.validated.params.courseId);
  return successResponse(res, "Vocabulary exercises fetched successfully", { exercises });
});

export const getPublishedVocabularyExercisesController = asyncHandler(async (req, res) => {
  const exercises = await getVocabularyExercises(req.validated.params.courseId, { publishedOnly: true });
  return successResponse(res, "Vocabulary exercises fetched successfully", { exercises });
});

export const upsertVocabularyExerciseController = asyncHandler(async (req, res) => {
  const exercise = await upsertVocabularyExercise(
    req.validated.params.courseId,
    req.validated.params.lessonKey,
    req.validated.body,
    req.user,
  );
  return successResponse(res, "Vocabulary exercise saved successfully", { exercise });
});

export const deleteVocabularyExerciseController = asyncHandler(async (req, res) => {
  const data = await deleteVocabularyExercise(
    req.validated.params.courseId,
    req.validated.params.lessonKey,
  );
  return successResponse(res, "Vocabulary exercise deleted successfully", data);
});

export const generateVocabularyExerciseController = asyncHandler(async (req, res) => {
  const exercise = await generateVocabularyExerciseWithAi(
    req.validated.params.courseId,
    req.validated.params.lessonKey,
    req.validated.body,
    req.user,
  );
  return successResponse(res, "Vocabulary exercise generated successfully", { exercise }, 201);
});
