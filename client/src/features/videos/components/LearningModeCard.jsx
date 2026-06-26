import { Card } from "../../../components/ui/card.jsx";
import { Button } from "../../../components/ui/button.jsx";

export default function LearningModeCard({ desc, imageAlt, imageUrl, mode, onSelectMode, title }) {
  return (
    <Card className="overflow-hidden bg-cream-soft transition hover:-translate-y-1 hover:border-coral/40">
      <Button
        className="flex h-full w-full min-w-0 flex-col gap-2.5 whitespace-normal rounded-xl bg-transparent px-4 py-4 text-coal hover:bg-cream sm:gap-3 sm:px-5 sm:py-7"
        onClick={() => onSelectMode(mode)}
        type="button"
        variant="ghost"
      >
        <img alt={imageAlt} className="h-16 w-16 shrink-0 object-contain sm:h-24 sm:w-24" src={imageUrl} />
        <div className="min-w-0 space-y-0.5 text-center sm:space-y-1">
          <span className="block text-wrap font-display text-[0.95rem] font-medium leading-snug sm:text-base">
            {title}
          </span>
          <span className="block text-wrap text-xs leading-snug text-ink-muted sm:leading-relaxed">
            {desc}
          </span>
        </div>
      </Button>
    </Card>
  );
}
