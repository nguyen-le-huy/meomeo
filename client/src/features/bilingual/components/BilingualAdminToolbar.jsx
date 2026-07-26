import { Languages, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { Badge } from "../../../components/ui/badge.jsx";
import { Alert } from "../../../components/ui/alert.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import ManualVietsubDialog from "./ManualVietsubDialog.jsx";
import TranscriptImportTools from "./TranscriptImportTools.jsx";

export default function BilingualAdminToolbar({
  analyzeTranscriptMutation,
  bilingualError,
  bilingualProgress = 0,
  bilingualStatus,
  bilingualTotalCount = 0,
  bilingualTranslatedCount = 0,
  generateVietsubMutation,
  hasSegments,
  onVietsubDone,
  segments,
  transcriptSource,
  transcriptStatus,
  videoId,
}) {
  const isGenerating = generateVietsubMutation?.isPending;
  const analyzeError =
    analyzeTranscriptMutation?.error?.response?.data?.message || analyzeTranscriptMutation?.error?.message;
  const mutationError = generateVietsubMutation?.error?.response?.data?.message || generateVietsubMutation?.error?.message;
  const displayError = analyzeError || mutationError || bilingualError;
  const canGenerate =
    transcriptStatus === "completed" && !isGenerating && hasSegments && bilingualStatus !== "processing";
  const hasTranslation = bilingualStatus === "completed";

  function handleAnalyzeTranscript() {
    if (transcriptStatus === "completed") {
      const confirmed = window.confirm(
        "Phân tích lại sẽ thay toàn bộ transcript hiện tại và xoá Vietsub đã ghép. Bạn muốn tiếp tục?",
      );
      if (!confirmed) return;
    }
    analyzeTranscriptMutation?.mutate();
  }

  return (
    <div className="space-y-3 rounded-xl bg-cream-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={transcriptStatus === "completed" ? "success" : "warning"}>
          Transcript: {transcriptStatus}
        </Badge>
        {transcriptSource ? (
          <Badge variant={transcriptSource === "openai_whisper" ? "success" : "secondary"}>
            Source: {transcriptSource}
          </Badge>
        ) : null}
        <Badge
          variant={
            bilingualStatus === "completed"
              ? "success"
              : bilingualStatus === "failed"
                ? "warning"
                : "default"
          }
        >
          Vietsub: {bilingualStatus}
        </Badge>
      </div>

      {bilingualStatus === "processing" || isGenerating ? (
        <div className="rounded-lg border border-coral/30 bg-coral/10 p-3 text-coal">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 text-coral">
              <Spinner size="sm" />
              Đang tạo Vietsub bằng AI...
            </span>
            <span className="font-semibold text-coal">
              {bilingualTranslatedCount || 0} / {bilingualTotalCount || segments?.length || 0} câu ({bilingualProgress || 0}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-coral transition-all duration-500 ease-out"
              style={{ width: `${Math.max(3, bilingualProgress || 0)}%` }}
            />
          </div>
        </div>
      ) : null}

      {displayError && bilingualStatus !== "processing" ? (
        <Alert className="text-sm" variant="warning">
          {displayError}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {transcriptStatus !== "pending" && transcriptStatus !== "processing" ? (
          <Button
            disabled={analyzeTranscriptMutation?.isPending}
            onClick={handleAnalyzeTranscript}
            size="sm"
            type="button"
            variant="outline"
          >
            {analyzeTranscriptMutation?.isPending ? <Spinner size="sm" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            {transcriptStatus === "completed" ? "Phân tích lại transcript" : "Thử lại transcript"}
          </Button>
        ) : null}
        <Button
          disabled={!canGenerate}
          onClick={() => generateVietsubMutation?.mutate({ force: false })}
          size="sm"
          type="button"
          variant={hasTranslation ? "outline" : "default"}
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" />
              Đang dịch...
            </>
          ) : hasTranslation ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Dịch lại tự động
            </>
          ) : (
            <>
              <Languages className="mr-1 h-3 w-3" />
              Tạo Vietsub tự động
            </>
          )}
        </Button>

        {transcriptStatus === "completed" && segments?.length > 0 ? (
          <ManualVietsubDialog segments={segments} onDone={onVietsubDone} />
        ) : null}
      </div>

      {transcriptStatus === "completed" && segments?.length > 0 ? (
        <TranscriptImportTools onDone={onVietsubDone} segments={segments} videoId={videoId} />
      ) : null}

      {!canGenerate && transcriptStatus !== "completed" ? (
        <p className="text-xs text-ink-muted">Cần phân tích transcript trước khi tạo Vietsub.</p>
      ) : null}
    </div>
  );
}
