# AI Learning Map — Tài liệu triển khai cho Meomeo

## Tổng quan

AI Learning Map là tính năng mới mở rộng từ module Ebook hiện có của Meomeo. Module Ebook hiện đã hỗ trợ upload PDF/EPUB, lưu file trên R2, publish ebook, reader settings, progress và bookmark. Tính năng mới không thay thế luồng ebook hiện tại, mà thêm một chế độ học bằng sơ đồ kiến thức ngay trong Ebook Reader.

Luồng nghiệp vụ:

```text
Admin upload/publish ebook bằng module Ebook hiện có
        ↓
Admin bấm tạo AI Learning Map
        ↓
Backend đọc file ebook từ storage và trích xuất nội dung
        ↓
AI tạo cây kiến thức gồm group node và lesson node
        ↓
Người học mở ebook và chuyển sang tab/split view Learning Map
        ↓
Người học chọn lesson node để sinh hoặc xem bài học đã cache
        ↓
Người học đánh dấu hoàn thành trên trình duyệt hiện tại
```

## Nguyên tắc tích hợp

* Giữ dự án chính là YouTube Shadowing and Dictation learning app.
* AI Learning Map là module phụ trong hệ Ebook, không tạo hướng sản phẩm mới.
* Không tạo tài khoản học viên.
* Admin controls vẫn render inline khi `user?.role === "admin"`.
* Không tạo admin dashboard riêng.
* Không dùng shadcn/ui hoặc shadcn CLI.
* Reuse UI primitives trong `client/src/components/ui`.
* Reuse API/auth/storage/sessionId pattern hiện có.

## Phạm vi MVP

Bao gồm:

* Tạo learning map cho ebook PDF/EPUB đã upload.
* Theo dõi trạng thái tạo map trên ebook.
* Hiển thị tree trong Ebook Reader.
* Chọn lesson node để xem bài học trọng tâm.
* Sinh lesson bằng AI theo cơ chế lazy generation.
* Cache lesson trong MongoDB.
* Đánh dấu hoàn thành bằng LocalStorage hoặc `sessionId` local.
* Tạo lại map bởi admin.

Không bao gồm:

* Chat với toàn bộ sách.
* Quiz/flashcard/spaced repetition.
* Tài khoản học viên.
* Đồng bộ tiến độ learning map đa thiết bị.
* Vector database/RAG.
* Fine-tuning.
* n8n workflow.

## Tài liệu

| File | Nội dung |
| --- | --- |
| `01_GIOI_THIEU_TONG_QUAN.md` | Bài toán, mục tiêu, phạm vi, định hướng tích hợp và công nghệ |
| `02_PHAN_TICH_VA_THIET_KE_HE_THONG.md` | Chức năng, use case, sequence diagram, data model, API và source plan |

## Module liên quan hiện có

| Khu vực | File/thư mục hiện có |
| --- | --- |
| Ebook backend | `server/src/modules/ebooks/` |
| Ebook model | `server/src/modules/ebooks/ebook.model.js` |
| Ebook routes | `server/src/modules/ebooks/ebook.routes.js` |
| Ebook reader page | `client/src/features/ebooks/pages/EbookReaderPage.jsx` |
| Admin ebook page | `client/src/features/ebooks/pages/AdminEbooksPage.jsx` |
| Ebook API client | `client/src/features/ebooks/services/ebookApi.js` |

## Module cần thêm

```text
server/src/modules/ebook-learning/
├── ebook-learning.controller.js
├── ebook-learning.routes.js
├── ebook-learning.service.js
├── ebook-learning.validation.js
├── ebookLearningNode.model.js
├── ebookLearningLesson.model.js
├── ebookLearningJob.model.js
├── documentParser.service.js
├── ebookLearningAi.service.js
├── prompts/
│   ├── map.prompt.js
│   └── lesson.prompt.js
└── schemas/
    ├── map.schema.js
    └── lesson.schema.js
```

```text
client/src/features/ebooks/
├── components/LearningMap/
├── hooks/useEbookLearningMap.js
├── hooks/useEbookLearningCompletion.js
└── services/ebookLearningApi.js
```
