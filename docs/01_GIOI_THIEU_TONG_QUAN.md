# 1. GIỚI THIỆU TỔNG QUAN

## 1.1. Tên tính năng

**AI Learning Map**

## 1.2. Bối cảnh dự án

Meomeo hiện là ứng dụng học tiếng Anh trọng tâm theo YouTube Shadowing và Dictation. Ngoài luồng video, dự án đã có module Ebook với các chức năng:

* Admin upload PDF/EPUB.
* Lưu ebook file trên R2.
* Lưu cover trên storage hiện tại.
* Publish/unpublish ebook.
* Public ebook library.
* Ebook reader cho PDF/EPUB.
* Reader settings, progress và bookmark theo `sessionId`.
* Dictionary popover trong reader.

AI Learning Map là tính năng mới trong hệ Ebook. Tính năng này không thay đổi MVP chính của YouTube learning, mà tận dụng ebook đã upload để tạo lộ trình học trực quan.

## 1.3. Đặt vấn đề

PDF/EPUB thường dài, nhiều chương và nhiều tầng kiến thức. Ebook Reader hiện giúp người học đọc sách, nhưng chưa giúp họ:

1. Nhìn cấu trúc kiến thức tổng thể.
2. Biết phần nào là trọng tâm.
3. Học theo các đơn vị nhỏ có mục tiêu rõ ràng.
4. Tóm tắt nội dung quan trọng theo từng lesson.
5. Theo dõi các lesson đã hoàn thành.

Vì Meomeo không yêu cầu tài khoản học viên, giải pháp cần đơn giản, chạy được trên public UI, nhưng vẫn cho admin quyền tạo lại map và kiểm soát trạng thái xử lý.

## 1.4. Mô tả bài toán

Hệ thống cần cho phép admin tạo AI Learning Map cho một ebook đã có trong MongoDB. Sau khi admin yêu cầu tạo map:

1. Backend đọc metadata ebook.
2. Backend lấy file từ R2 hoặc URL lưu trữ hiện tại.
3. Parser trích xuất nội dung PDF/EPUB thành các section có thứ tự.
4. AI phân tích section và trả về cây kiến thức theo schema.
5. Backend validate output và lưu node vào MongoDB.
6. Ebook được cập nhật trạng thái map.

Người học mở ebook reader và có thể:

1. Mở panel/tab Learning Map.
2. Xem cây kiến thức.
3. Mở/đóng group node.
4. Chọn lesson node.
5. Xem lesson đã cache hoặc yêu cầu sinh lesson lần đầu.
6. Đánh dấu hoàn thành/bỏ hoàn thành trên trình duyệt hiện tại.

## 1.5. Mục tiêu

### Mục tiêu nghiệp vụ

Tạo một luồng học sách rõ ràng:

```text
Đọc ebook
→ Xem sơ đồ học
→ Chọn lesson trọng tâm
→ Học phần tóm tắt có căn cứ
→ Đánh dấu hoàn thành
```

### Mục tiêu người dùng

Người học có thể:

* Hiểu cấu trúc tổng thể của sách.
* Xác định các phần nên học trước.
* Học theo các lesson nhỏ thay vì đọc tràn lan.
* Xem giải thích trọng tâm dựa trên nội dung sách.
* Theo dõi tiến độ cơ bản mà không cần đăng nhập.

### Mục tiêu kỹ thuật

* Tích hợp vào `server/src/modules/ebooks` và `client/src/features/ebooks`.
* Tách business logic AI vào module mới `ebook-learning`.
* Không làm hỏng luồng ebook reader/progress/bookmark hiện tại.
* Không hard-code model AI trong source code.
* Dùng structured output và Zod validation trước khi lưu.
* Không lưu hoặc trả `sourceText` trong API public map.
* Cache lesson để giảm chi phí AI.
* Có trạng thái xử lý và lỗi rõ ràng để admin biết khi map failed.

## 1.6. Phạm vi hệ thống

### Trong phạm vi MVP

* Tạo map cho ebook PDF/EPUB đã upload.
* Trích xuất nội dung ebook từ file hiện có.
* Tạo group node và lesson node.
* Lưu node, source range và source text nội bộ.
* Hiển thị map trong Ebook Reader.
* Sinh lesson khi người học chọn lesson node lần đầu.
* Cache lesson trong MongoDB.
* Đánh dấu hoàn thành bằng LocalStorage.
* Admin tạo lại map.

### Ngoài phạm vi MVP

* Sửa thủ công từng node trong UI.
* Chat với toàn bộ sách.
* Quiz, flashcard, spaced repetition.
* Voice tutor/audio lesson.
* Tài khoản học viên.
* Đồng bộ hoàn thành đa thiết bị.
* Vector database/RAG.
* Fine-tuning.

## 1.7. Đối tượng sử dụng

### Admin

Admin có thể:

* Upload ebook bằng luồng hiện có.
* Publish/unpublish ebook.
* Tạo AI Learning Map cho ebook.
* Xem trạng thái map.
* Tạo lại map khi nội dung hoặc prompt thay đổi.

### Người học

Người học không cần đăng nhập.

Người học có thể:

* Đọc ebook đã publish.
* Mở Learning Map.
* Xem cây kiến thức.
* Chọn lesson node.
* Xem bài học trọng tâm.
* Đánh dấu hoàn thành.

## 1.8. Định hướng giải quyết

### Bước 1 — Reuse Ebook hiện có

Ebook model hiện có các trường quan trọng:

```js
{
  title: String,
  slug: String,
  format: "epub" | "pdf",
  fileUrl: String,
  fileStorageProvider: "cloudinary" | "r2",
  fileStorageKey: String,
  isPublished: Boolean
}
```

Tính năng mới thêm trạng thái AI map vào Ebook hoặc lưu riêng trong `EbookLearningJob`.

### Bước 2 — Parse nội dung

Backend đọc file từ storage rồi chuẩn hóa thành sections:

```json
{
  "ebookId": "ebook-id",
  "format": "pdf",
  "sections": [
    {
      "title": "Chapter 1",
      "orderIndex": 1,
      "pageStart": 1,
      "pageEnd": 20,
      "content": "..."
    }
  ]
}
```

PDF ưu tiên page range. EPUB ưu tiên spine/chapter order và CFI/chapter id nếu lấy được.

### Bước 3 — Tạo knowledge map

AI trả JSON theo schema:

```json
{
  "nodes": [
    {
      "tempId": "part-1",
      "parentTempId": null,
      "title": "Part I",
      "summary": "Overview",
      "nodeType": "group",
      "orderIndex": 1,
      "level": 1
    },
    {
      "tempId": "lesson-1",
      "parentTempId": "part-1",
      "title": "Two Systems",
      "summary": "Core idea",
      "nodeType": "lesson",
      "orderIndex": 1,
      "level": 2,
      "sourceSectionIndexes": [1],
      "pageStart": 1,
      "pageEnd": 12
    }
  ]
}
```

### Bước 4 — Sinh lesson

Khi người học chọn lesson node:

```text
GET lesson
→ kiểm tra cache
→ lấy sourceText nội bộ
→ gọi AI nếu chưa có cache
→ validate JSON
→ lưu EbookLearningLesson
→ trả lesson public
```

### Bước 5 — Hoàn thành node

MVP lưu hoàn thành ở LocalStorage:

```text
meomeo:ebook-learning-map:<ebookId>
```

```json
{
  "version": 1,
  "completedNodeIds": ["node-id"]
}
```

## 1.9. Cơ sở lý thuyết

### Hierarchical learning

Sách được biểu diễn thành cây:

```text
Book
├── Part
│   ├── Chapter
│   │   ├── Lesson
│   │   └── Lesson
│   └── Chapter
└── Part
```

Tree giúp người học nhìn quan hệ cha-con, thứ tự học và phạm vi của từng lesson.

### Grounded generation

Lesson phải dựa trên `sourceText` của node. AI không được tự thêm dữ kiện ngoài sách như nguồn chính. Ví dụ AI tự tạo phải được gắn nhãn.

### Lazy generation và cache

Map được tạo trước, lesson sinh sau khi cần. Cách này giảm thời gian tạo map, giảm chi phí AI và tránh sinh lesson cho node không ai mở.

### Structured output

AI output phải là JSON đúng schema. Backend validate trước khi lưu để UI render ổn định.

## 1.10. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React, Vite |
| UI | Tailwind CSS, reusable UI primitives, lucide-react |
| Server state | TanStack Query |
| Client state | Zustand hoặc local hook |
| Reader | PDF.js, EPUB.js |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Auth | JWT admin role |
| AI | OpenAI Responses API hoặc Chat Completions structured JSON |
| Storage | R2/Cloudinary theo Ebook hiện có |
| Completion state | LocalStorage |

### Biến môi trường đề xuất

```env
OPENAI_API_KEY=
OPENAI_EBOOK_MAP_MODEL=
OPENAI_EBOOK_LESSON_MODEL=
EBOOK_LEARNING_MAX_SECTION_CHARS=12000
EBOOK_LEARNING_MAX_LESSON_SOURCE_CHARS=18000
```

## 1.11. Tiêu chí thành công

1. Admin tạo được map cho ebook PDF/EPUB đã tồn tại.
2. Map có group node và lesson node theo đúng thứ tự.
3. Public reader hiển thị được Learning Map cho ebook đã publish.
4. Lesson node sinh bài học từ source text đúng phạm vi.
5. Lesson được cache sau lần đầu.
6. Hoàn thành node còn sau reload trình duyệt.
7. Tạo lại map xóa hoặc archive map cũ theo rule rõ ràng.
8. Luồng reader/progress/bookmark cũ vẫn hoạt động.
