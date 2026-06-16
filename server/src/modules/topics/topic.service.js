import { Topic } from "./topic.model.js";
import { VideoLesson } from "../videos/video.model.js";
import { createHttpError } from "../../utils/createHttpError.js";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createSlug(value) {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(name, ignoredId) {
  const baseSlug = createSlug(name) || "topic";
  let slug = baseSlug;
  let suffix = 2;

  while (await Topic.exists({ slug, ...(ignoredId ? { _id: { $ne: ignoredId } } : {}) })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getTopics(query = {}, options = {}) {
  const filter = {};

  if (!options.admin || !query.includeUnpublished) {
    filter.isPublished = true;
  } else if (typeof query.isPublished === "boolean") {
    filter.isPublished = query.isPublished;
  }

  if (query.search) {
    filter.name = { $regex: escapeRegExp(query.search), $options: "i" };
  }

  return Topic.find(filter).sort({ order: 1, name: 1 });
}

export async function getTopicBySlug(slug, options = {}) {
  const filter = { slug };
  if (!options.admin) filter.isPublished = true;
  const topic = await Topic.findOne(filter);

  if (!topic) throw createHttpError(404, "Topic not found");
  return topic;
}

export async function createTopic(data) {
  const slug = await createUniqueSlug(data.name);
  return Topic.create({
    name: data.name,
    slug,
    description: data.description || "",
    order: data.order ?? 0,
    isPublished: data.isPublished ?? true,
  });
}

export async function updateTopic(id, data) {
  const topic = await Topic.findById(id);
  if (!topic) throw createHttpError(404, "Topic not found");

  if (data.name !== undefined) {
    topic.name = data.name;
    topic.slug = await createUniqueSlug(data.name, id);
  }
  if (data.description !== undefined) topic.description = data.description;
  if (data.order !== undefined) topic.order = data.order;
  if (data.isPublished !== undefined) topic.isPublished = data.isPublished;

  await topic.save();
  return topic;
}

export async function deleteTopic(id) {
  const topic = await Topic.findById(id);
  if (!topic) throw createHttpError(404, "Topic not found");

  const videoCount = await VideoLesson.countDocuments({ topicId: id });
  if (videoCount > 0) {
    throw createHttpError(409, "Cannot delete topic with videos");
  }

  await topic.deleteOne();
  return { id };
}
