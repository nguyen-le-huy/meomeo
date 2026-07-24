import { getTopicId } from "./manualTranscript.js";

function sortVideosForTopic(videos) {
  return [...videos].sort((firstVideo, secondVideo) => {
    const firstOrder = Number.isFinite(Number(firstVideo.order)) ? Number(firstVideo.order) : null;
    const secondOrder = Number.isFinite(Number(secondVideo.order)) ? Number(secondVideo.order) : null;

    if (firstOrder !== null || secondOrder !== null) {
      if (firstOrder === null) return 1;
      if (secondOrder === null) return -1;
      if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    }

    const firstCreatedAt = new Date(firstVideo.createdAt || 0).getTime();
    const secondCreatedAt = new Date(secondVideo.createdAt || 0).getTime();

    return secondCreatedAt - firstCreatedAt;
  });
}

export function buildTopicSections({ isAdmin, topics, videos }) {
  const sections = topics
    .map((topic) => ({
      key: topic._id,
      title: topic.name,
      description: topic.description,
      topic,
      videos: sortVideosForTopic(videos.filter((video) => getTopicId(video) === topic._id)),
    }))
    .filter((section) => isAdmin || section.videos.length > 0);
  const knownTopicIds = new Set(topics.map((topic) => topic._id));
  const uncategorizedVideos = sortVideosForTopic(videos.filter((video) => !knownTopicIds.has(getTopicId(video))));

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

export function interleaveTopicSections(sections, videosPerCategory = 2) {
  const groupSize = Math.max(1, Math.floor(Number(videosPerCategory)) || 2);
  const longestSectionLength = sections.reduce(
    (longestLength, section) => Math.max(longestLength, section.videos.length),
    0,
  );
  const roundCount = Math.ceil(longestSectionLength / groupSize);
  const interleavedSections = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const groupStartIndex = roundIndex * groupSize;

    sections.forEach((section) => {
      const groupedVideos = section.videos.slice(groupStartIndex, groupStartIndex + groupSize);
      if (!groupedVideos.length) return;

      interleavedSections.push({
        ...section,
        key: `${section.key}-round-${roundIndex}`,
        videos: groupedVideos,
      });
    });
  }

  return interleavedSections;
}

export { getTopicId };

export function getNewestVideoIds(videos, limit = 3) {
  return new Set(
    [...videos]
      .sort((firstVideo, secondVideo) => {
        const firstCreatedAt = new Date(firstVideo.createdAt || 0).getTime();
        const secondCreatedAt = new Date(secondVideo.createdAt || 0).getTime();

        return secondCreatedAt - firstCreatedAt;
      })
      .slice(0, limit)
      .map((video) => video._id),
  );
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = Math.floor(total % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}
