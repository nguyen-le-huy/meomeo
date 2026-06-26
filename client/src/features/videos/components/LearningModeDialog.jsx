import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.jsx";
import { modeConfig } from "../constants/videoLibrary.constants.js";
import LearningModeCard from "./LearningModeCard.jsx";

export default function LearningModeDialog({ onOpenChange, onSelectMode, open }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="bottom-0 top-auto max-h-[92vh] w-full max-w-none translate-y-0 gap-3 rounded-b-none rounded-t-2xl p-3 pb-4 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-5 sm:rounded-xl sm:p-8">
        <div className="mx-auto h-1 w-16 rounded-full bg-cream sm:hidden" />
        <DialogHeader className="px-0 text-left sm:text-center">
          <DialogTitle className="text-xl">Chọn chế độ</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-4">
          {modeConfig.map((item) => (
            <LearningModeCard key={item.mode} {...item} onSelectMode={onSelectMode} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
