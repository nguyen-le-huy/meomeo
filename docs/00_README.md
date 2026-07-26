# AI Learning Map — Tài liệu phân tích và thiết kế

## Tổng quan

AI Learning Map là tính năng mở rộng của module Ebook trong dự án Meomeo.

Luồng nghiệp vụ:

```text
Admin tải giáo trình PDF/EPUB
        ↓
Hệ thống trích xuất nội dung
        ↓
AI tạo sơ đồ kiến thức
        ↓
Người học chọn lesson node
        ↓
AI sinh bài học trọng tâm
        ↓
Người học đánh dấu hoàn thành
```

## Phạm vi MVP

Tính năng bao gồm:

* Upload giáo trình PDF hoặc EPUB.
* Tạo sơ đồ kiến thức bằng AI.
* Hiển thị sơ đồ dạng cây.
* Chọn lesson node để xem bài học.
* Sinh bài học khi node được mở lần đầu.
* Lưu bài học trong MongoDB.
* Đánh dấu hoàn thành bằng LocalStorage.

Không bao gồm:

* Chat với toàn bộ giáo trình.
* Quiz.
* Flashcard.
* Lịch ôn tập.
* Tài khoản học viên.
* Đồng bộ nhiều thiết bị.
* Vector database.
* RAG.
* n8n.

## Danh sách tài liệu

| File                                   | Nội dung                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `01_GIOI_THIEU_TONG_QUAN.md`           | Đặt vấn đề, mô tả bài toán, định hướng giải quyết, cơ sở lý thuyết và công nghệ |
| `02_PHAN_TICH_VA_THIET_KE_HE_THONG.md` | Chức năng, use case, sequence diagram, class diagram và mô hình dữ liệu         |

## Cấu trúc thư mục

```text
docs/
└── ai-learning-map/
    ├── 00_README.md
    ├── 01_GIOI_THIEU_TONG_QUAN.md
    └── 02_PHAN_TICH_VA_THIET_KE_HE_THONG.md
```
