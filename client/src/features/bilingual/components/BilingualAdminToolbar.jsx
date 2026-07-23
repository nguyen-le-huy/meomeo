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
  bilingualStatus,
  generateVietsubMutation,
  hasSegments,
  onVietsubDone,
  segments,
  transcriptStatus,
  videoId,
}) {
  const isGenerating = generateVietsubMutation?.isPending;
  const mutationError = generateVietsubMutation?.error?.response?.data?.message || generateVietsubMutation?.error?.message;
  const displayError = mutationError || bilingualError;
  const canGenerate =
    transcriptStatus === "completed" && !isGenerating && hasSegments && bilingualStatus !== "processing";
  const hasTranslation = bilingualStatus === "completed";

  return (
    <div className="space-y-3 rounded-xl bg-cream-soft p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={transcriptStatus === "completed" ? "success" : "warning"}>
          Transcript: {transcriptStatus}
        </Badge>
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

      {displayError ? (
        <Alert className="text-sm" variant="warning">
          {displayError}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {transcriptStatus === "failed" ? (
          <Button
            disabled={analyzeTranscriptMutation?.isPending}
            onClick={() => analyzeTranscriptMutation?.mutate()}
            size="sm"
            type="button"
            variant="outline"
          >
            {analyzeTranscriptMutation?.isPending ? <Spinner size="sm" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Thử lại transcript
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
