import { useEffect, useMemo, useRef, useState } from "react";

const defaultInitialCount = 15;
const defaultBatchSize = 5;

export function useLazyTopicSections(sections, options = {}) {
  const { batchSize = defaultBatchSize, initialCount = defaultInitialCount } = options;
  const [visibleVideoCount, setVisibleVideoCount] = useState(initialCount);
  const loadMoreRef = useRef(null);
  const totalVideoCount = useMemo(
    () => sections.reduce((total, section) => total + section.videos.length, 0),
    [sections],
  );
  const hasMoreVideos = visibleVideoCount < totalVideoCount;
  const visibleSections = useMemo(() => {
    let remainingVideos = visibleVideoCount;

    return sections
      .map((section) => {
        if (remainingVideos <= 0) return { ...section, videos: [] };

        const videos = section.videos.slice(0, remainingVideos);
        remainingVideos -= videos.length;

        return { ...section, videos };
      })
      .filter((section) => section.videos.length > 0);
  }, [sections, visibleVideoCount]);

  useEffect(() => {
    setVisibleVideoCount(initialCount);
  }, [initialCount, sections]);

  useEffect(() => {
    if (!hasMoreVideos) return undefined;

    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisibleVideoCount((current) => Math.min(current + batchSize, totalVideoCount));
      },
      { rootMargin: "640px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batchSize, hasMoreVideos, totalVideoCount]);

  return { hasMoreSections: hasMoreVideos, hasMoreVideos, loadMoreRef, visibleSections };
}
