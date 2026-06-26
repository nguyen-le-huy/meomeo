import { getTopicId } from "./manualTranscript.js";

export function buildTopicSections({ isAdmin, topics, videos }) {
  const sections = topics
    .map((topic) => ({
      key: topic._id,
      title: topic.name,
      description: topic.description,
      topic,
      videos: videos.filter((video) => getTopicId(video) === topic._id),
    }))
    .filter((section) => isAdmin || section.videos.length > 0);
  const knownTopicIds = new Set(topics.map((topic) => topic._id));
  const uncategorizedVideos = videos.filter((video) => !knownTopicIds.has(getTopicId(video)));

  if (uncategorizedVideos.length || isAdmin) {
    sections.push({
      key: "uncategorized",
      title: isAdmin ? "Chưa phân loại" : "Video mới",
      description: isAdmin ? "Video đang nằm ngoài các topic công khai." : "Các video mới nhất trong thư viện.",
      topic: null,
      videos: uncategorizedVideos,
    });
  }

  return sections;
}

export { getTopicId };

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = Math.floor(total % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
