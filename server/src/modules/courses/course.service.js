import { Course } from "./course.model.js";
import { VocabularyItem } from "../vocabulary/vocabulary.model.js";
import { VocabularyExercise } from "../vocabulary/vocabularyExercise.model.js";
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

async function createUniqueSlug(title, ignoredCourseId) {
  const baseSlug = createSlug(title) || "vocabulary-course";
  let slug = baseSlug;
  let suffix = 2;

  while (
    await Course.exists({
      type: "vocabulary",
      slug,
      ...(ignoredCourseId ? { _id: { $ne: ignoredCourseId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getHealth() {
  return { module: "courses", status: "ok" };
}

export async function createVocabularyCourse(data, adminUser) {
  const slug = await createUniqueSlug(data.title);

  return Course.create({
    title: data.title,
    slug,
    type: "vocabulary",
    description: data.description || "",
    thumbnailUrl: data.thumbnailUrl || "",
    level: data.level || "beginner",
    order: data.order ?? 0,
    isPublished: data.isPublished ?? false,
    createdBy: adminUser.id,
  });
}

export async function getVocabularyCourses(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const filter = { type: "vocabulary" };

  if (query.search) {
    filter.title = { $regex: escapeRegExp(query.search), $options: "i" };
  }

  if (typeof query.isPublished === "boolean") {
    filter.isPublished = query.isPublished;
  }

  if (query.level) {
    filter.level = query.level;
  }

  const sort = { [query.sort || "order"]: query.sort === "createdAt" ? -1 : 1 };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Course.find(filter).sort(sort).skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPublishedVocabularyCourses(query) {
  return getVocabularyCourses({ ...query, isPublished: true });
}

export async function getVocabularyCourseById(id) {
  const course = await Course.findOne({ _id: id, type: "vocabulary" });

  if (!course) {
    throw createHttpError(404, "Vocabulary course not found");
  }

  return course;
}

export async function getPublishedVocabularyCourseById(id) {
  const course = await Course.findOne({ _id: id, type: "vocabulary", isPublished: true });
  if (!course) throw createHttpError(404, "Vocabulary course not found");
  return course;
}

export async function updateVocabularyCourse(id, data) {
  const course = await getVocabularyCourseById(id);

  if (data.title !== undefined) {
    course.title = data.title;
    course.slug = await createUniqueSlug(data.title, id);
  }

  if (data.description !== undefined) course.description = data.description;
  if (data.thumbnailUrl !== undefined) course.thumbnailUrl = data.thumbnailUrl;
  if (data.level !== undefined) course.level = data.level;
  if (data.order !== undefined) course.order = data.order;
  if (data.isPublished !== undefined) course.isPublished = data.isPublished;

  await course.save();
  return course;
}

export async function deleteVocabularyCourse(id) {
  const course = await getVocabularyCourseById(id);

  await VocabularyItem.deleteMany({ courseId: course._id });
  await VocabularyExercise.deleteMany({ courseId: course._id });
  await course.deleteOne();
  return { id };
}

export async function togglePublishVocabularyCourse(id) {
  const course = await getVocabularyCourseById(id);
  course.isPublished = !course.isPublished;
  await course.save();
  return course;
}
