import { cn } from "../../../utils/cn.js";

export const allTopicsValue = "__all__";

export default function TopicCategoryChips({ selectedTopicId, topics, onSelectTopic }) {
  const chips = [{ _id: allTopicsValue, name: "All" }, ...topics];

  if (!topics.length) return null;

  return (
    <div className="-mx-4 mb-8 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex min-w-max items-center gap-2">
        {chips.map((topic) => {
          const isSelected = selectedTopicId === topic._id;

          return (
            <button
              className={cn(
                "h-8 rounded-lg px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35",
                isSelected
                  ? "bg-coal text-white"
                  : "bg-[#ebe8e1] text-coal hover:bg-[#ded9cf]",
              )}
              key={topic._id}
              onClick={() => onSelectTopic(topic._id)}
              type="button"
            >
              {topic.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
