import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/ui/button.jsx";
import { Spinner } from "../../../components/ui/spinner.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { levels } from "../constants/videoLibrary.constants.js";
import { parseManualTranscript } from "../utils/manualTranscript.js";

export default function AddVideoDialog({ createVideoMutation, onVideoCreated, topics }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptError, setTranscriptError] = useState("");
  const [videoForm, setVideoForm] = useState({
    topicId: "__none__",
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: true,
  });

  async function handleCreateVideo(event) {
    event.preventDefault();
    setTranscriptError("");

    const manualTranscripts = parseManualTranscript(transcriptText);

    if (manualTranscripts.error) {
      setTranscriptError(manualTranscripts.error);
      return;
    }

    const response = await createVideoMutation.mutateAsync({
      ...videoForm,
      topicId: videoForm.topicId === "__none__" ? undefined : videoForm.topicId,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
      transcripts: manualTranscripts.segments.length ? manualTranscripts.segments : undefined,
    });
    const video = response.data.data.video;
    setVideoForm({ topicId: "__none__", youtubeUrl: "", title: "", description: "", level: "A2", isPublished: true });
    setTranscriptText("");
    setIsOpen(false);
    onVideoCreated(video);
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus size={16} /> Thêm video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm video YouTube</DialogTitle>
          <DialogDescription>
            Nếu để trống, hệ thống sẽ ưu tiên phụ đề YouTube rồi tự nhận dạng audio khi video không có phụ đề.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={handleCreateVideo}>
          <Input
            onChange={(event) => setVideoForm((current) => ({ ...current, youtubeUrl: event.target.value }))}
            placeholder="YouTube URL"
            required
            value={videoForm.youtubeUrl}
          />
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <Input
              onChange={(event) => setVideoForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title tùy chỉnh"
              value={videoForm.title}
            />
            <Select
              onValueChange={(value) => setVideoForm((current) => ({ ...current, level: value }))}
              value={videoForm.level}
            >
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            onValueChange={(value) => setVideoForm((current) => ({ ...current, topicId: value }))}
            value={videoForm.topicId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Chưa phân loại</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic._id} value={topic._id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            onChange={(event) => setVideoForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Mô tả ngắn"
            value={videoForm.description}
          />
          <div className="space-y-2 rounded-2xl border border-[#d8e1ed] bg-canvas p-3">
            <div>
              <p className="text-sm font-black text-coal">Transcript thủ công</p>
              <p className="mt-1 text-xs font-semibold text-ink-muted">
                Mỗi dòng gồm thời gian bắt đầu, thời gian kết thúc và nội dung. Ví dụ:
                <br />
                <span className="font-mono">00:01 - 00:04 Hello everyone</span>
                <br />
                <span className="font-mono">4.5 | 7.2 | This is a sentence</span>
              </p>
            </div>
            <Textarea
              className="min-h-40 bg-white font-mono text-sm"
              onChange={(event) => {
                setTranscriptText(event.target.value);
                setTranscriptError("");
              }}
              placeholder={`00:01 - 00:04 Hello everyone\n00:04 - 00:07 Welcome back to class`}
              value={transcriptText}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-ink-muted">
              <span>{parseManualTranscript(transcriptText).segments.length || 0} segment thủ công</span>
              <Button
                onClick={() => {
                  setTranscriptText("");
                  setTranscriptError("");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Xóa transcript
              </Button>
            </div>
            {transcriptError ? <p className="text-sm font-bold text-red-600">{transcriptError}</p> : null}
          </div>
          {createVideoMutation.error ? (
            <p className="text-sm font-bold text-red-600">
              {createVideoMutation.error.response?.data?.message || "Không thêm được video."}
            </p>
          ) : null}
          <Button disabled={!videoForm.youtubeUrl.trim()} isLoading={createVideoMutation.isPending} type="submit">
            Thêm video và xem song ngữ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
