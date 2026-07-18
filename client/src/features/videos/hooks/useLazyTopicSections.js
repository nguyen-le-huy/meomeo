import { useEffect, useMemo, useRef, useState } from "react";

const defaultBatchSize = 5;

export function useLazyTopicSections(sections, batchSize = defaultBatchSize) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const loadMoreRef = useRef(null);
  const hasMoreSections = visibleCount < sections.length;
  const visibleSections = useMemo(() => sections.slice(0, visibleCount), [sections, visibleCount]);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, sections]);

  useEffect(() => {
    if (!hasMoreSections) return undefined;

    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + batchSize, sections.length));
      },
      { rootMargin: "640px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [batchSize, hasMoreSections, sections.length]);

  return { hasMoreSections, loadMoreRef, visibleSections };
}
