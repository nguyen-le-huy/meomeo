import { ChevronLeft, ChevronRight, Eye, Keyboard, Mic, Pause, Play, RotateCcw, Settings, Zap } from "lucide-react";
import {
  compactActiveButtonClass,
  compactButtonClass,
  difficulties,
  toolbarButtonClass,
} from "../constants/videoLearning.constants.js";
import DictationResult from "./DictationResult.jsx";
import InlineDictationInputs from "./InlineDictationInputs.jsx";
import MaskedWordChips from "./MaskedWordChips.jsx";

export default function DictationPractice({
  answer,
  checkMutation,
  correctPraise,
  correctStickerUrl,
  currentIndex,
  difficulty,
  hasStarted,
  inlineWordAnswers,
  isPlayerPlaying,
  isYoutubeReady,
  onChangeAnswer,
  onChangeDifficulty,
  onChangeInlineWord,
  onMoveAndPlay,
  onRevealAllWords,
  onRevealInlineWord,
  onRevealWord,
  onReplayCurrentSegment,
  onStartFirstSegment,
  onSubmit,
  onToggleCurrentSegmentPlayback,
  progressPercent,
  revealedWordIndexes,
  segment,
  segmentsCount,
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {difficulties.map((item) => (
            <button
              className={difficulty === item ? compactActiveButtonClass : compactButtonClass}
              key={item}
              onClick={() => onChangeDifficulty(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className={toolbarButtonClass} type="button">
            <Settings size={17} />
          </button>
          <span className="inline-flex items-center gap-1 text-sm font-black text-coal">
            <Zap size={16} /> 1x
          </span>
          <span className="rounded-lg border border-[#dbe4ee] bg-[#f9fbff] px-3 py-1.5 text-sm font-black text-coal">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div className="hidden items-center justify-between rounded-2xl border border-[#dbe4ee] bg-[#f9fbff] px-4 py-3 xl:flex">
        <div className="flex items-center gap-3">
          <button className={toolbarButtonClass} disabled={currentIndex === 0 || !isYoutubeReady} onClick={() => onMoveAndPlay(-1)} type="button">
            <ChevronLeft size={17} />
          </button>
          <button className={toolbarButtonClass} disabled={!segment || !isYoutubeReady} onClick={onReplayCurrentSegment} type="button">
            <RotateCcw size={17} />
          </button>
          <button className={toolbarButtonClass} disabled={!segment || !isYoutubeReady} onClick={onToggleCurrentSegmentPlayback} type="button">
            {isPlayerPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            className={toolbarButtonClass}
            disabled={currentIndex >= segmentsCount - 1 || !isYoutubeReady}
            onClick={() => onMoveAndPlay(1)}
            type="button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-black text-coal">
            <Zap size={16} /> 1x
          </span>
          <button className={toolbarButtonClass} type="button">
            <Settings size={17} />
          </button>
          <button className={toolbarButtonClass} type="button">
            <Keyboard size={17} />
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-coal/70 xl:hidden">Điền trực tiếp vào các ô trống. Bấm mắt để hiện từ đó.</p>
      {segment ? (
        <div className="xl:hidden">
          <InlineDictationInputs
            difficulty={difficulty}
            inlineWordAnswers={inlineWordAnswers}
            onChangeWord={onChangeInlineWord}
            onRevealWord={onRevealInlineWord}
            revealedWordIndexes={revealedWordIndexes}
            text={segment.text}
          />
        </div>
      ) : null}

      <div className="relative hidden rounded-2xl border border-[#dbe4ee] bg-white p-4 shadow-sm xl:block">
        <label className="mb-3 hidden text-sm font-black uppercase tracking-wide text-coal/65 xl:block">Gõ những gì bạn nghe được:</label>
        <textarea
          className="min-h-36 w-full resize-none rounded-xl border-0 bg-transparent text-base font-semibold text-coal outline-none placeholder:text-coal/55 xl:min-h-32 xl:text-lg"
          onChange={(event) => onChangeAnswer(event.target.value)}
          placeholder="Gõ câu trả lời của bạn ở đây..."
          value={answer}
        />
        <button
          className="absolute bottom-[-14px] right-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe4ee] bg-white text-coal shadow-sm"
          type="button"
        >
          <Mic size={16} />
        </button>
      </div>

      {correctPraise ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#bfe9c9] bg-[#d7f8df] px-4 py-3 text-sm font-black text-[#0e7a3d]">
          <span className="min-w-0 flex-1">{correctPraise}</span>
          {correctStickerUrl ? (
            <img alt="" aria-hidden="true" className="h-24 shrink-0 object-contain" src={correctStickerUrl} />
          ) : null}
        </div>
      ) : null}

      {segment ? (
        <div className="hidden space-y-2 xl:block">
          <MaskedWordChips
            difficulty={difficulty}
            onRevealWord={onRevealWord}
            revealedWordIndexes={revealedWordIndexes}
            text={segment.text}
          />
          <p className="text-sm font-semibold text-coal/65">Các từ được tiết lộ sẽ bị tính là lỗi và ảnh hưởng đến điểm số của bạn.</p>
        </div>
      ) : null}

      <button
        className="hidden h-12 w-full rounded-2xl border-2 border-[#ffc72c] bg-[#fffaf0] text-sm font-black uppercase text-[#bf5700] xl:block"
        onClick={onRevealAllWords}
        type="button"
      >
        <Eye className="mr-2 inline" size={17} />
        Hiện tất cả từ
      </button>
      <button
        className="hidden h-14 w-full rounded-2xl bg-[#292f68] text-base font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50 xl:block"
        disabled={!segment || currentIndex >= segmentsCount - 1 || !isYoutubeReady}
        onClick={() => onMoveAndPlay(1)}
        type="button"
      >
        Tiếp theo <ChevronRight className="inline" size={18} />
      </button>
      <button className="sr-only" disabled={!segment || checkMutation.isPending} type="submit">
        {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
      </button>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#dbe4ee] bg-white p-3 xl:hidden">
        {hasStarted ? (
          <div className="grid grid-cols-4 gap-2">
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#292f68] text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!segment || !isYoutubeReady}
              onClick={onToggleCurrentSegmentPlayback}
              type="button"
            >
              {isPlayerPlaying ? <Pause size={19} /> : <Play size={19} />}
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!segment || !isYoutubeReady}
              onClick={onReplayCurrentSegment}
              type="button"
            >
              <RotateCcw size={19} />
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentIndex === 0 || !isYoutubeReady}
              onClick={() => onMoveAndPlay(-1)}
              type="button"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#dbe4ee] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentIndex >= segmentsCount - 1 || !isYoutubeReady}
              onClick={() => onMoveAndPlay(1)}
              type="button"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        ) : (
          <button
            className="h-14 w-full rounded-2xl bg-[#292f68] text-base font-black uppercase text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!segment || !isYoutubeReady}
            onClick={onStartFirstSegment}
            type="button"
          >
            <Play className="mr-2 inline" size={17} /> Bắt đầu
          </button>
        )}
      </div>

      {checkMutation.data?.data?.data ? <DictationResult result={checkMutation.data.data.data} /> : null}
    </form>
  );
}
