import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit3, Eye, EyeOff, FolderPlus, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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

function getNextTopicOrder(topics) {
  if (!topics.length) return 0;
  return Math.max(...topics.map((topic) => Number(topic.order) || 0)) + 1;
}

function SortableTopicCard({ disabled, onDelete, onEdit, topic }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic._id,
    disabled,
  });

  return (
    <Card
      className={`bg-canvas ${isDragging ? "relative z-10 shadow-lg ring-2 ring-coral/30" : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CardContent className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Kéo để đổi vị trí topic ${topic.name}`}
          className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-muted hover:bg-cream-soft hover:text-coal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          type="button"
        >
          <GripVertical size={18} />
        </button>
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
        <Button disabled={disabled} onClick={() => onEdit(topic)} size="icon" type="button" variant="outline">
          <Edit3 size={15} />
        </Button>
        <Button disabled={disabled} onClick={() => onDelete(topic)} size="icon" type="button" variant="outline">
          <Trash2 size={15} />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function TopicManagerDialog({
  createTopicMutation,
  deleteTopicMutation,
  reorderTopicsMutation,
  topics,
  updateTopicMutation,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    order: getNextTopicOrder(topics),
    isPublished: true,
  });
  const [orderedTopics, setOrderedTopics] = useState(topics);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setOrderedTopics(topics);
    if (!editingTopic) {
      setForm((current) => ({ ...current, order: getNextTopicOrder(topics) }));
    }
  }, [editingTopic, topics]);

  function resetForm() {
    setEditingTopic(null);
    setForm({ name: "", description: "", order: getNextTopicOrder(orderedTopics), isPublished: true });
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

  function reorderTopicList({ active, over }) {
    if (!over || active.id === over.id || reorderTopicsMutation.isPending) return;

    const previousTopics = orderedTopics;
    const oldIndex = previousTopics.findIndex((topic) => topic._id === active.id);
    const newIndex = previousTopics.findIndex((topic) => topic._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextTopics = arrayMove(previousTopics, oldIndex, newIndex).map((topic, order) => ({ ...topic, order }));
    setOrderedTopics(nextTopics);
    reorderTopicsMutation.mutate(
      nextTopics.map((topic) => topic._id),
      { onError: () => setOrderedTopics(previousTopics) },
    );
  }

  const activeError =
    createTopicMutation.error?.response?.data?.message ||
    updateTopicMutation.error?.response?.data?.message ||
    deleteTopicMutation.error?.response?.data?.message ||
    reorderTopicsMutation.error?.response?.data?.message ||
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

          <div>
            {orderedTopics.length > 1 ? (
              <p className="mb-2 text-xs text-ink-muted">Kéo biểu tượng ⋮⋮ để thay đổi thứ tự hiển thị.</p>
            ) : null}
            {orderedTopics.length ? (
              <DndContext collisionDetection={closestCenter} onDragEnd={reorderTopicList} sensors={sensors}>
                <SortableContext
                  items={orderedTopics.map((topic) => topic._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {orderedTopics.map((topic) => (
                      <SortableTopicCard
                        disabled={reorderTopicsMutation.isPending}
                        key={topic._id}
                        onDelete={(selectedTopic) => {
                          if (window.confirm(`Xóa topic "${selectedTopic.name}"? Chỉ xóa được topic chưa có video.`)) {
                            deleteTopicMutation.mutate(selectedTopic._id);
                          }
                        }}
                        onEdit={editTopic}
                        topic={topic}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
