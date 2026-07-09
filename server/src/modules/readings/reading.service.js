import { createHttpError } from "../../utils/createHttpError.js";
import { ReadingLesson } from "./reading.model.js";

const readingWordsPerMinute = 200;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function uniqueSlug(input, currentId) {
  const base = slugify(input) || `reading-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (await ReadingLesson.exists({ slug, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

function deriveParagraphsFromHtml(html) {
  const text = String(html || "")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>\s*/gi, "\n")
    .replace(/<br\s*\/?>\s*/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return text
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function sanitizePayload(data) {
  const payload = { ...data };
  if (payload.bodyHtml) {
    if (!payload.paragraphs || payload.paragraphs.length === 0) {
      payload.paragraphs = deriveParagraphsFromHtml(payload.bodyHtml);
    }
  }
  if (payload.paragraphs) payload.paragraphs = payload.paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
  delete payload.durationLabel;
  delete payload.wordCount;
  delete payload.estimatedReadingMinutes;
  if (payload.questions) {
    payload.questions = payload.questions.map((question) => ({
      ...question,
      choices: question.choices.map((choice) => choice.trim()).filter(Boolean),
      explanation: question.explanation || "",
    }));
  }
  if (payload.secondaryImageUrl === "") payload.secondaryImageUrl = "";
  return payload;
}

function countWords(parts = []) {
  return parts
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function applyReadingEstimate(payload) {
  const wordCount = countWords([payload.summary || "", ...(payload.paragraphs || [])]);
  const estimatedReadingMinutes = Math.max(1, Math.ceil(wordCount / readingWordsPerMinute));
  return {
    ...payload,
    wordCount,
    estimatedReadingMinutes,
    durationLabel: `${estimatedReadingMinutes} phút`,
  };
}

function buildReadingFilter(query = {}, options = {}) {
  const filter = {};

  if (!options.admin || !query.includeUnpublished) {
    filter.isPublished = true;
  }

  if (query.search) {
    const search = { $regex: escapeRegExp(query.search), $options: "i" };
    filter.$or = [{ title: search }, { summary: search }];
  }

  return filter;
}

export async function getReadings(query = {}, options = {}) {
  return ReadingLesson.find(buildReadingFilter(query, options)).sort({ publishedAt: -1, createdAt: -1 });
}

export async function getLatestReading(options = {}) {
  return ReadingLesson.findOne({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 });
}

export async function getReadingBySlug(slug, options = {}) {
  const filter = { slug };
  if (!options.admin) filter.isPublished = true;
  const reading = await ReadingLesson.findOne(filter);
  if (!reading) throw createHttpError(404, "Reading not found");
  return reading;
}

export async function getReadingById(id, options = {}) {
  const filter = { _id: id };
  if (!options.admin) filter.isPublished = true;
  const reading = await ReadingLesson.findOne(filter);
  if (!reading) throw createHttpError(404, "Reading not found");
  return reading;
}

export async function createReading(data, adminUser) {
  const payload = applyReadingEstimate(sanitizePayload(data));
  const slug = await uniqueSlug(payload.slug || payload.title);

  return ReadingLesson.create({
    ...payload,
    slug,
    questions: payload.questions || [],
    createdBy: adminUser.id,
  });
}

export async function updateReading(id, data) {
  const reading = await getReadingById(id, { admin: true });
  const sanitizedPayload = sanitizePayload(data);
  const payload = applyReadingEstimate({
    summary: reading.summary,
    paragraphs: reading.paragraphs,
    ...sanitizedPayload,
  });

  Object.assign(reading, payload);

  if (payload.slug !== undefined) {
    reading.slug = await uniqueSlug(payload.slug, reading._id);
  } else if (payload.title !== undefined && !reading.slug) {
    reading.slug = await uniqueSlug(payload.title, reading._id);
  }

  await reading.save();
  return reading;
}

export async function deleteReading(id) {
  const reading = await getReadingById(id, { admin: true });
  await reading.deleteOne();
  return { id };
}

export async function publishReading(id, isPublished) {
  const reading = await getReadingById(id, { admin: true });
  reading.isPublished = isPublished;
  await reading.save();
  return reading;
}
