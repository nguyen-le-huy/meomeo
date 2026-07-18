import { ChevronLeft, ChevronRight, Eye, Pause, Play, RotateCcw } from "lucide-react";
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
  onNext,
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
  const currentStep = segmentsCount ? Math.min(currentIndex + 1, segmentsCount) : 0;

  return (
    <form className="space-y-5 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:space-y-3" onSubmit={onSubmit}>
      <div className="rounded-2xl border border-[#e6dfd8] bg-white p-4 shadow-[0_12px_30px_rgba(20,20,19,0.06)] xl:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Tiến độ</span>
            <p className="mt-0.5 text-sm font-semibold text-coal">
              {currentStep || 0}/{segmentsCount || 0}
            </p>
          </div>
          <span className="rounded-full bg-coal px-2.5 py-1 text-xs font-semibold text-white">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-cream-soft">
          <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 rounded-xl border border-[#e6dfd8] bg-cream-soft/80 p-1 shadow-inner shadow-coal/[0.03]">
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
      </div>

      <div className="hidden items-center justify-between rounded-2xl border border-[#e6dfd8] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(20,20,19,0.05)] xl:flex">
        <div className="flex items-center gap-1">
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
            disabled={!segment || !isYoutubeReady}
            onClick={onNext}
            type="button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <p className="hidden text-xs font-semibold text-ink-muted 2xl:block">Nghe từng đoạn, nhập lại câu bạn nghe được.</p>
      </div>

      <p className="text-sm text-ink-muted xl:hidden">Điền trực tiếp vào các ô trống. Bấm mắt để hiện từ đó.</p>
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

      <div className="hidden rounded-2xl border border-[#e6dfd8] bg-white p-4 shadow-[0_16px_38px_rgba(20,20,19,0.06)] xl:block xl:shrink-0">
        <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.18em] text-ink-muted">Gõ những gì bạn nghe được</label>
        <textarea
          className="min-h-32 w-full resize-none rounded-2xl border border-[#eee7de] bg-[#fbfaf7] px-5 py-4 text-xl font-semibold leading-relaxed text-coal outline-none transition placeholder:text-ink-muted/55 focus:border-coral/45 focus:bg-white focus:ring-4 focus:ring-coral/10 xl:min-h-[26vh] xl:text-2xl"
          onChange={(event) => onChangeAnswer(event.target.value)}
          placeholder="Gõ câu trả lời của bạn ở đây..."
          value={answer}
        />
      </div>

      {correctPraise ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#bed9c4] bg-[#e3f2e5] px-4 py-3 text-sm font-semibold text-[#356b42] shadow-[0_12px_28px_rgba(53,107,66,0.08)]">
          <span className="min-w-0 flex-1">{correctPraise}</span>
          {correctStickerUrl ? (
            <img alt="" aria-hidden="true" className="h-24 shrink-0 object-contain" src={correctStickerUrl} />
          ) : null}
        </div>
      ) : null}

      {segment ? (
        <div className="hidden rounded-2xl border border-[#e6dfd8] bg-white p-4 shadow-[0_16px_38px_rgba(20,20,19,0.05)] xl:block xl:shrink">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-muted">Từ gợi ý</p>
            <p className="text-xs font-semibold text-ink-muted">Bấm vào từ để hiện đáp án</p>
          </div>
          <MaskedWordChips
            difficulty={difficulty}
            onRevealWord={onRevealWord}
            revealedWordIndexes={revealedWordIndexes}
            text={segment.text}
          />
          <p className="mt-2 text-sm text-ink-muted">Các từ được tiết lộ sẽ bị tính là lỗi và ảnh hưởng đến điểm số của bạn.</p>
        </div>
      ) : null}

      <button
        className="hidden h-11 w-full rounded-xl border border-coral/30 bg-white text-sm font-bold text-coral-dark shadow-sm transition hover:border-coral/50 hover:bg-coral/5 xl:block"
        onClick={onRevealAllWords}
        type="button"
      >
        <Eye className="mr-2 inline" size={17} />
        Hiện tất cả từ
      </button>
      <button
        className="hidden h-12 w-full rounded-xl bg-coal text-sm font-bold text-white shadow-[0_14px_30px_rgba(20,20,19,0.18)] transition hover:bg-coral-dark disabled:cursor-not-allowed disabled:opacity-50 xl:block"
        disabled={!segment || !isYoutubeReady}
        onClick={onNext}
        type="button"
      >
        Tiếp theo <ChevronRight className="inline" size={18} />
      </button>
      <button className="sr-only" disabled={!segment || checkMutation.isPending} type="submit">
        {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
      </button>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6dfd8] bg-white/95 p-3 shadow-[0_-18px_36px_rgba(20,20,19,0.10)] backdrop-blur xl:hidden">
        {hasStarted ? (
          <div className="grid grid-cols-4 gap-2">
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-coal text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!segment || !isYoutubeReady}
              onClick={onToggleCurrentSegmentPlayback}
              type="button"
            >
              {isPlayerPlaying ? <Pause size={19} /> : <Play size={19} />}
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#e6dfd8] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!segment || !isYoutubeReady}
              onClick={onReplayCurrentSegment}
              type="button"
            >
              <RotateCcw size={19} />
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#e6dfd8] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentIndex === 0 || !isYoutubeReady}
              onClick={() => onMoveAndPlay(-1)}
              type="button"
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#e6dfd8] bg-white text-coal shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!segment || !isYoutubeReady}
              onClick={onNext}
              type="button"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        ) : (
          <button
            className="h-14 w-full rounded-2xl bg-coal text-base font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
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
