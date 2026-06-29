import {
  createTopic,
  deleteTopic,
  getTopicBySlug,
  getTopics,
  reorderTopics,
  updateTopic,
} from "./topic.service.js";
import { getVideosByTopicSlug } from "../videos/video.service.js";
import { successResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

function isAdmin(req) {
  return req.user?.role === "admin";
}

export const getTopicsController = asyncHandler(async (req, res) => {
  const topics = await getTopics(req.validated.query, { admin: isAdmin(req) });
  return successResponse(res, "Topics fetched successfully", { topics });
});

export const getTopicVideosController = asyncHandler(async (req, res) => {
  const topic = await getTopicBySlug(req.validated.params.slug, { admin: isAdmin(req) });
  const videos = await getVideosByTopicSlug(topic.slug, { admin: isAdmin(req) });
  return successResponse(res, "Topic videos fetched successfully", { topic, videos });
});

export const createTopicController = asyncHandler(async (req, res) => {
  const topic = await createTopic(req.validated.body);
  return successResponse(res, "Topic created successfully", { topic }, 201);
});

export const updateTopicController = asyncHandler(async (req, res) => {
  const topic = await updateTopic(req.validated.params.id, req.validated.body);
  return successResponse(res, "Topic updated successfully", { topic });
});

export const reorderTopicsController = asyncHandler(async (req, res) => {
  const topics = await reorderTopics(req.validated.body.topicIds);
  return successResponse(res, "Topics reordered successfully", { topics });
});

export const deleteTopicController = asyncHandler(async (req, res) => {
  const data = await deleteTopic(req.validated.params.id);
  return successResponse(res, "Topic deleted successfully", data);
});
