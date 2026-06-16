import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../auth/stores/authStore.js";
import {
  useCreateTopic,
  useCreateVideo,
  useDeleteVideo,
  usePublishVideo,
  useTopics,
  useVideos,
} from "../hooks/useVideoLearning.js";

const levels = ["A1", "A2", "B1", "B2", "C1"];

export default function VideoLibraryPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [topicId, setTopicId] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const params = useMemo(
    () => ({
      topicId: topicId || undefined,
      level: level || undefined,
      search: search || undefined,
      includeUnpublished: isAdmin || undefined,
    }),
    [isAdmin, level, search, topicId],
  );
  const { data: topics = [] } = useTopics({ includeUnpublished: isAdmin || undefined });
  const { data: videos = [], isLoading } = useVideos(params);
  const createTopicMutation = useCreateTopic();
  const createVideoMutation = useCreateVideo();
  const publishVideoMutation = usePublishVideo();
  const deleteVideoMutation = useDeleteVideo();

  return (
    <section className="h-full overflow-auto bg-matcha p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-coal/55">Meomeo Listening</p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">Shadowing & Dictation qua YouTube</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-coal/65">
              Chọn một video, nghe từng segment, luyện chép chính tả hoặc đọc shadowing ngay.
            </p>
          </div>
          {isAdmin ? <AdminCreatePanel createTopicMutation={createTopicMutation} createVideoMutation={createVideoMutation} topics={topics} /> : null}
        </div>

        <div className="mb-5 grid gap-3 rounded-xl bg-white/70 p-4 md:grid-cols-[1fr_180px_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-coal/45" size={18} />
            <input
              className="h-11 w-full rounded-lg border border-coal/15 bg-white pl-10 pr-4 text-sm outline-none focus:border-coal"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm video..."
              value={search}
            />
          </label>
          <select
            className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm font-semibold outline-none"
            onChange={(event) => setTopicId(event.target.value)}
            value={topicId}
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.name}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-lg border border-coal/15 bg-white px-3 text-sm font-semibold outline-none"
            onChange={(event) => setLevel(event.target.value)}
            value={level}
          >
            <option value="">Tất cả level</option>
            {levels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? <p className="font-bold">Đang tải video...</p> : null}
        {!isLoading && videos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-coal/20 bg-white/70 p-8 text-center font-bold">
            Chưa có video nào. Admin đăng nhập để thêm video đầu tiên.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <article className="overflow-hidden rounded-xl border border-coal/10 bg-white/80 shadow-sm" key={video._id}>
              <Link to={`/videos/${video._id}`}>
                <div className="aspect-video overflow-hidden bg-coal/10">
                  <img alt={video.title} className="h-full w-full object-cover" src={video.thumbnailUrl} />
                </div>
              </Link>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                  <span className="rounded-full bg-coal px-2 py-1 text-white">{video.level}</span>
                  <span className="rounded-full bg-matcha px-2 py-1">{video.topicId?.name || "No topic"}</span>
                  {!video.isPublished ? <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Draft</span> : null}
                </div>
                <Link className="block text-lg font-black leading-snug hover:underline" to={`/videos/${video._id}`}>
                  {video.title}
                </Link>
                <p className="line-clamp-2 text-sm font-semibold text-coal/60">{video.description || "Video luyện nghe tiếng Anh."}</p>
                <div className="flex gap-2">
                  <Link className="flex-1 rounded-lg bg-black px-3 py-2 text-center text-sm font-bold text-white" to={`/videos/${video._id}?mode=dictation`}>
                    Dictation
                  </Link>
                  <Link className="flex-1 rounded-lg border border-coal/20 px-3 py-2 text-center text-sm font-bold" to={`/videos/${video._id}?mode=shadowing`}>
                    Shadowing
                  </Link>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2 border-t border-coal/10 pt-3">
                    <button
                      className="rounded-lg border border-coal/20 px-3 py-2 text-xs font-bold"
                      onClick={() => publishVideoMutation.mutate({ id: video._id, isPublished: !video.isPublished })}
                      type="button"
                    >
                      {video.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                      onClick={() => {
                        if (window.confirm("Xóa video này?")) deleteVideoMutation.mutate(video._id);
                      }}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminCreatePanel({ createTopicMutation, createVideoMutation, topics }) {
  const [topicName, setTopicName] = useState("");
  const [videoForm, setVideoForm] = useState({
    topicId: "",
    youtubeUrl: "",
    title: "",
    description: "",
    level: "A2",
    isPublished: false,
  });

  async function handleCreateTopic(event) {
    event.preventDefault();
    if (!topicName.trim()) return;
    await createTopicMutation.mutateAsync({ name: topicName.trim(), isPublished: true });
    setTopicName("");
  }

  async function handleCreateVideo(event) {
    event.preventDefault();
    await createVideoMutation.mutateAsync({
      ...videoForm,
      title: videoForm.title || undefined,
      description: videoForm.description || undefined,
    });
    setVideoForm({ topicId: "", youtubeUrl: "", title: "", description: "", level: "A2", isPublished: false });
  }

  return (
    <details className="w-full max-w-xl rounded-xl bg-white/80 p-4 shadow-sm md:w-[520px]">
      <summary className="cursor-pointer text-sm font-black">
        <span className="inline-flex items-center gap-2">
          <Plus size={16} /> Admin: thêm topic/video
        </span>
      </summary>
      <div className="mt-4 grid gap-4">
        <form className="flex gap-2" onSubmit={handleCreateTopic}>
          <input
            className="h-10 min-w-0 flex-1 rounded-lg border border-coal/15 px-3 text-sm outline-none"
            onChange={(event) => setTopicName(event.target.value)}
            placeholder="Tên chủ đề mới"
            value={topicName}
          />
          <button className="rounded-lg bg-black px-3 text-sm font-bold text-white" disabled={createTopicMutation.isPending}>
            Thêm
          </button>
        </form>
        <form className="grid gap-2" onSubmit={handleCreateVideo}>
          <select
            className="h-10 rounded-lg border border-coal/15 px-3 text-sm outline-none"
            onChange={(event) => setVideoForm((current) => ({ ...current, topicId: event.target.value }))}
            required
            value={videoForm.topicId}
          >
            <option value="">Chọn chủ đề</option>
            {topics.map((topic) => (
              <option key={topic._id} value={topic._id}>
                {topic.name}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-lg border border-coal/15 px-3 text-sm outline-none"
            onChange={(event) => setVideoForm((current) => ({ ...current, youtubeUrl: event.target.value }))}
            placeholder="YouTube URL"
            required
            value={videoForm.youtubeUrl}
          />
          <div className="grid gap-2 md:grid-cols-[1fr_100px]">
            <input
              className="h-10 rounded-lg border border-coal/15 px-3 text-sm outline-none"
              onChange={(event) => setVideoForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Title tùy chỉnh"
              value={videoForm.title}
            />
            <select
              className="h-10 rounded-lg border border-coal/15 px-3 text-sm outline-none"
              onChange={(event) => setVideoForm((current) => ({ ...current, level: event.target.value }))}
              value={videoForm.level}
            >
              {levels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="min-h-20 rounded-lg border border-coal/15 p-3 text-sm outline-none"
            onChange={(event) => setVideoForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Mô tả ngắn"
            value={videoForm.description}
          />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              checked={videoForm.isPublished}
              className="accent-coal"
              onChange={(event) => setVideoForm((current) => ({ ...current, isPublished: event.target.checked }))}
              type="checkbox"
            />
            Publish ngay
          </label>
          {createVideoMutation.error ? (
            <p className="text-sm font-bold text-red-600">{createVideoMutation.error.response?.data?.message || "Không thêm được video."}</p>
          ) : null}
          <button className="h-10 rounded-lg bg-black text-sm font-bold text-white" disabled={createVideoMutation.isPending}>
            {createVideoMutation.isPending ? "Đang thêm..." : "Thêm video"}
          </button>
        </form>
      </div>
    </details>
  );
}
