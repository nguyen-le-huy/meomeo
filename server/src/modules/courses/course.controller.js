import {
  createVocabularyCourse,
  deleteVocabularyCourse,
  getHealth,
  getPublishedVocabularyCourses,
  getVocabularyCourseById,
  getVocabularyCourses,
  togglePublishVocabularyCourse,
  updateVocabularyCourse,
} from "./course.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getCourseHealth = asyncHandler(async (req, res) => {
  const data = await getHealth();
  return successResponse(res, "Success", data);
});

export const createVocabularyCourseController = asyncHandler(async (req, res) => {
  const course = await createVocabularyCourse(req.validated.body, req.user);
  return successResponse(res, "Vocabulary course created successfully", { course }, 201);
});

export const getVocabularyCoursesController = asyncHandler(async (req, res) => {
  const data = await getVocabularyCourses(req.validated.query);
  return successResponse(res, "Vocabulary courses fetched successfully", data);
});

export const getPublishedVocabularyCoursesController = asyncHandler(async (req, res) => {
  const data = await getPublishedVocabularyCourses(req.validated.query);
  return successResponse(res, "Vocabulary courses fetched successfully", data);
});

export const getVocabularyCourseDetailController = asyncHandler(async (req, res) => {
  const course = await getVocabularyCourseById(req.validated.params.id);
  return successResponse(res, "Vocabulary course fetched successfully", { course });
});

export const updateVocabularyCourseController = asyncHandler(async (req, res) => {
  const course = await updateVocabularyCourse(req.validated.params.id, req.validated.body);
  return successResponse(res, "Vocabulary course updated successfully", { course });
});

export const deleteVocabularyCourseController = asyncHandler(async (req, res) => {
  const data = await deleteVocabularyCourse(req.validated.params.id);
  return successResponse(res, "Vocabulary course deleted successfully", data);
});

export const togglePublishVocabularyCourseController = asyncHandler(async (req, res) => {
  const course = await togglePublishVocabularyCourse(req.validated.params.id);
  return successResponse(res, "Vocabulary course publish status updated successfully", { course });
});
