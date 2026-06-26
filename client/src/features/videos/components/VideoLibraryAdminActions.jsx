import AddVideoDialog from "./AddVideoDialog.jsx";
import TopicManagerDialog from "./TopicManagerDialog.jsx";

export default function VideoLibraryAdminActions({
  createTopicMutation,
  createVideoMutation,
  deleteTopicMutation,
  onVideoCreated,
  topics,
  updateTopicMutation,
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <TopicManagerDialog
        createTopicMutation={createTopicMutation}
        deleteTopicMutation={deleteTopicMutation}
        topics={topics}
        updateTopicMutation={updateTopicMutation}
      />
      <AddVideoDialog
        createVideoMutation={createVideoMutation}
        onVideoCreated={onVideoCreated}
        topics={topics}
      />
    </div>
  );
}
