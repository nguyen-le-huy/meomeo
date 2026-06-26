import { Edit3, Eye, EyeOff, FolderPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../components/ui/badge.jsx";
import { Button } from "../../../components/ui/button.jsx";
import { Card, CardContent } from "../../../components/ui/card.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.jsx";
import { Input } from "../../../components/ui/input.jsx";
import { Textarea } from "../../../components/ui/textarea.jsx";
import { Alert } from "../../../components/ui/alert.jsx";

export default function TopicManagerDialog({ createTopicMutation, deleteTopicMutation, topics, updateTopicMutation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", order: 0, isPublished: true });

  function resetForm() {
    setEditingTopic(null);
    setForm({ name: "", description: "", order: 0, isPublished: true });
  }

  function editTopic(topic) {
    setEditingTopic(topic);
    setForm({
      name: topic.name || "",
      description: topic.description || "",
      order: topic.order || 0,
      isPublished: topic.isPublished ?? true,
    });
  }

  async function submitTopic(event) {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      order: Number(form.order || 0),
      isPublished: form.isPublished,
    };

    if (editingTopic?._id) {
      await updateTopicMutation.mutateAsync({ id: editingTopic._id, data: payload });
    } else {
      await createTopicMutation.mutateAsync(payload);
    }

    resetForm();
  }

  const activeError =
    createTopicMutation.error?.response?.data?.message ||
    updateTopicMutation.error?.response?.data?.message ||
    deleteTopicMutation.error?.response?.data?.message ||
    "";

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
      open={isOpen}
    >
      <DialogTrigger asChild>
        <Button className="rounded-xl" type="button" variant="outline">
          <FolderPlus size={16} /> Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quản lý topic video</DialogTitle>
          <DialogDescription>Tạo topic, sửa thông tin, ẩn/hiện topic và xóa topic chưa có video.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <form className="space-y-3 rounded-2xl border border-[#e6dfd8] bg-cream-soft p-4" onSubmit={submitTopic}>
            <p className="text-sm font-black text-coal">{editingTopic ? "Sửa topic" : "Thêm topic mới"}</p>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Tên topic, ví dụ Movie short clip"
              required
              value={form.name}
            />
            <Textarea
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Mô tả ngắn"
              value={form.description}
            />
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))}
                placeholder="Thứ tự"
                type="number"
                value={form.order}
              />
              <Button
                aria-label={form.isPublished ? "Topic đang hiển thị" : "Topic đang ẩn"}
                onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
                type="button"
                variant="outline"
              >
                {form.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button disabled={createTopicMutation.isPending || updateTopicMutation.isPending} type="submit">
                {editingTopic ? "Lưu topic" : "Tạo topic"}
              </Button>
              {editingTopic ? (
                <Button onClick={resetForm} type="button" variant="outline">
                  Hủy
                </Button>
              ) : null}
            </div>
            {activeError ? <Alert variant="error">{activeError}</Alert> : null}
          </form>

          <div className="space-y-2">
            {topics.length ? (
              topics.map((topic) => (
                <Card className="bg-canvas" key={topic._id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-coal">{topic.name}</p>
                        <Badge variant={topic.isPublished ? "success" : "secondary"}>
                          {topic.isPublished ? "Public" : "Ẩn"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-muted">
                        Thứ tự {topic.order || 0}
                        {topic.description ? ` · ${topic.description}` : ""}
                      </p>
                    </div>
                    <Button onClick={() => editTopic(topic)} size="icon" type="button" variant="outline">
                      <Edit3 size={15} />
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm(`Xóa topic "${topic.name}"? Chỉ xóa được topic chưa có video.`)) {
                          deleteTopicMutation.mutate(topic._id);
                        }
                      }}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed bg-canvas">
                <CardContent className="p-5 text-sm text-ink-muted">Chưa có topic nào.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
