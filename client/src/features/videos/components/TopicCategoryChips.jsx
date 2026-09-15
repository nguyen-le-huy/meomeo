import { cn } from "../../../utils/cn.js";

export const allTopicsValue = "__all__";

export default function TopicCategoryChips({ selectedTopicId, topics, onSelectTopic }) {
  const totalVideoCount = topics.reduce((total, topic) => total + (topic.videoCount || 0), 0);
  const chips = [{ _id: allTopicsValue, name: "All", videoCount: totalVideoCount }, ...topics];

  if (!topics.length) return null;

  return (
    <div className="-mx-4 mb-8 -mt-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-2 py-1">
        {chips.map((topic) => {
          const isSelected = selectedTopicId === topic._id;

          return (
            <button
              className={cn(
                "h-8 rounded-lg px-3.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35",
                isSelected
                  ? "bg-coal text-canvas shadow-sm dark:bg-[#faf9f5] dark:text-[#181715]"
                  : "bg-[#f0ece4] text-[#3d3d3a] hover:bg-[#e6e0d4] hover:text-[#141413] dark:border dark:border-[#38342f]/70 dark:bg-[#252320] dark:text-[#a09d96] dark:hover:border-[#4a453f] dark:hover:bg-[#2e2b27] dark:hover:text-[#faf9f5]",
              )}
              key={topic._id}
              onClick={() => onSelectTopic(topic._id)}
              type="button"
            >
              {topic.name}
              <span
                className={cn(
                  "ml-1.5 text-xs font-normal",
                  isSelected
                    ? "text-canvas/75 dark:text-[#181715]/70"
                    : "text-ink-muted dark:text-[#8e8b82]",
                )}
              >
                {topic.videoCount || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
