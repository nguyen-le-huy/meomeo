export default function VocabularyCourseTable({
  courses,
  onDelete,
  onEdit,
  onManageWords,
  onTogglePublish,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-coal/10 bg-white/80">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-matcha/60 text-xs uppercase text-coal/60">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr className="border-t border-coal/10" key={course._id}>
              <td className="px-4 py-3 font-bold">{course.title}</td>
              <td className="px-4 py-3">{course.level}</td>
              <td className="px-4 py-3">{course.order}</td>
              <td className="px-4 py-3">{course.isPublished ? "Published" : "Draft"}</td>
              <td className="px-4 py-3">
                {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "-"}
              </td>
              <td className="space-x-2 px-4 py-3">
                <button className="font-bold text-coal underline" onClick={() => onManageWords(course)}>
                  Manage Words
                </button>
                <button className="font-bold text-coal underline" onClick={() => onEdit(course)}>
                  Edit
                </button>
                <button
                  className="font-bold text-coal underline"
                  onClick={() => onTogglePublish(course)}
                >
                  {course.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  className="font-bold text-red-600 underline"
                  onClick={() => {
                    if (window.confirm("Delete this vocabulary course?")) {
                      onDelete(course);
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
