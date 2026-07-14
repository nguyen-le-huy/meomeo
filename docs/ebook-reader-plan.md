# Kế hoạch tích hợp trình đọc ebook online

## Mục tiêu

Thêm khu vực đọc ebook vào web hiện tại để admin upload sách EPUB/PDF và người dùng đọc trực tiếp trên trình duyệt. Web hiện là public learning app, không có student login, nên tiến độ đọc và bookmark không cần gắn với tài khoản học viên.

Tính năng phải bám theo hướng MVP hiện tại:

- Không tạo dashboard admin riêng cho MVP.
- Admin dùng inline controls ngay trong giao diện public ebook.
- Public user đọc ebook không cần đăng nhập.
- Chỉ admin đã đăng nhập mới được upload, sửa metadata, ẩn/xóa ebook.
- UI tuân theo `DESIGN.MD`, dùng Tailwind, primitive trong `client/src/components/ui`, không dùng shadcn CLI.

## Phạm vi MVP

### Có trong MVP

- Trang thư viện ebook public.
- Trang đọc ebook public.
- Admin inline upload ebook và ảnh bìa từ thư viện.
- Admin inline sửa metadata cơ bản: tiêu đề, tác giả, mô tả, cover, ngôn ngữ, tags, trạng thái publish.
- Hỗ trợ upload EPUB và PDF.
- Lưu metadata ebook trong MongoDB.
- Lưu file ebook ở storage phù hợp và lưu URL/public id trong DB.
- Đọc EPUB bằng `epubjs`.
- Đọc PDF bằng `pdfjs-dist`.
- Reader settings: cỡ chữ, font, theme sáng/tối/sepia, line height cho EPUB.
- Bookmark.
- Lưu vị trí đọc hiện tại.
- Hiển thị sách đang đọc dở từ thư viện.

### Chưa cần trong MVP

- Tài khoản student.
- Đồng bộ tiến độ đọc giữa nhiều người dùng.
- Highlight/note nâng cao.
- Tìm kiếm full text trong ebook.
- Convert định dạng trên server.
- DRM.
- Offline reading.
- Audiobook/TTS.
- PDF annotation phức tạp.

## Quyết định kỹ thuật chính

### Không lưu binary ebook trực tiếp trong MongoDB document

MongoDB document có giới hạn 16MB và việc stream file lớn từ document sẽ khó vận hành. Hướng khuyến nghị:

- MongoDB lưu metadata, trạng thái, storage provider, file URL, public id, dung lượng, mime type.
- File EPUB/PDF lưu ở Cloudinary dạng `raw` hoặc object storage tương đương.
- Nếu muốn self-host hoàn toàn, dùng local uploads hoặc GridFS ở phase sau.

Vì project đã có Cloudinary config và Multer, MVP nên mở rộng upload middleware cho document files và upload Cloudinary `resource_type: "raw"`.

### Vị trí đọc và bookmark

Do web là một người dùng và không cần login student, có hai lựa chọn:

1. Local-first: lưu progress/bookmark trong `localStorage`.
2. Server-backed singleton: lưu progress/bookmark vào DB theo `sessionId` ẩn danh.

Khuyến nghị MVP dùng cả hai theo tầng:

- `localStorage` để UI phản hồi ngay và không phụ thuộc network.
- API server lưu theo `sessionId` từ `client/src/utils/sessionId.js` để restore sau reload.

Không dùng user id cho progress/bookmark public.

## Backend

### Module mới

Tạo module theo cấu trúc chuẩn:

```txt
server/src/modules/ebooks/
├── ebook.model.js
├── ebook.routes.js
├── ebook.controller.js
├── ebook.service.js
└── ebook.validation.js
```

Tạo thêm model progress/bookmark trong cùng module:

```txt
server/src/modules/ebooks/
├── ebookBookmark.model.js
└── ebookProgress.model.js
```

Đăng ký route trong `server/src/routes/index.js`:

```js
router.use("/ebooks", ebookRoutes);
```

### Ebook model

Collection: `ebooks`

```js
{
  title: String,
  slug: String,
  author: String,
  description: String,
  language: String,
  tags: [String],
  format: "epub" | "pdf",
  mimeType: String,
  fileSize: Number,
  pageCount: Number,
  coverUrl: String,
  source: {
    provider: "cloudinary" | "local" | "gridfs",
    url: String,
    secureUrl: String,
    publicId: String,
    resourceType: "raw" | "image"
  },
  status: "draft" | "published" | "archived",
  uploadedBy: ObjectId,
  publishedAt: Date,
  lastOpenedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Index:

- Unique `slug`.
- Compound `{ status: 1, createdAt: -1 }`.
- Text index cho `title`, `author`, `description`, `tags`.

### EbookProgress model

Collection: `ebookprogresses`

```js
{
  ebook: ObjectId,
  sessionId: String,
  format: "epub" | "pdf",
  locator: {
    epubCfi: String,
    href: String,
    percentage: Number,
    page: Number,
    scrollTop: Number
  },
  settings: {
    fontFamily: String,
    fontSize: Number,
    lineHeight: Number,
    theme: "light" | "dark" | "sepia"
  },
  updatedAt: Date
}
```

Index:

- Unique `{ ebook: 1, sessionId: 1 }`.

### EbookBookmark model

Collection: `ebookbookmarks`

```js
{
  ebook: ObjectId,
  sessionId: String,
  label: String,
  note: String,
  format: "epub" | "pdf",
  locator: {
    epubCfi: String,
    href: String,
    percentage: Number,
    page: Number
  },
  excerpt: String,
  createdAt: Date,
  updatedAt: Date
}
```

Index:

- `{ ebook: 1, sessionId: 1, createdAt: -1 }`.

### Upload middleware

Hiện `server/src/middlewares/upload.middleware.js` chỉ cho image/audio/video. Cần thêm upload riêng cho ebook:

- MIME allowed:
  - `application/epub+zip`
  - `application/pdf`
  - `application/octet-stream` chỉ khi extension là `.epub`
- Extension allowed:
  - `.epub`
  - `.pdf`
- Size limit đề xuất:
  - EPUB: 100MB.
  - PDF: 150MB.

Nên tạo export riêng:

```js
export const uploadEbook = multer({
  storage: multer.memoryStorage(),
  fileFilter: ebookFileFilter,
  limits: { fileSize: ebookSizeLimits.pdf }
});
```

### Cloudinary upload

Tạo helper trong ebook service hoặc module media:

- Upload file chính với `resource_type: "raw"`.
- Folder: `meomeo/ebooks`.
- Public id gồm slug và timestamp để tránh trùng.
- Lưu `secure_url`, `public_id`, `bytes`, `format`.

Cover:

- Cho phép admin upload cover image riêng, hoặc phase đầu dùng cover URL optional.
- Với EPUB có thể trích cover ở phase sau nếu cần.

### API endpoints

Public:

```txt
GET    /api/ebooks
GET    /api/ebooks/:slug
GET    /api/ebooks/:id/file
GET    /api/ebooks/:id/progress?sessionId=
PUT    /api/ebooks/:id/progress
GET    /api/ebooks/:id/bookmarks?sessionId=
POST   /api/ebooks/:id/bookmarks
PATCH  /api/ebooks/:id/bookmarks/:bookmarkId
DELETE /api/ebooks/:id/bookmarks/:bookmarkId
```

Admin only:

```txt
POST   /api/ebooks
PATCH  /api/ebooks/:id
DELETE /api/ebooks/:id
POST   /api/ebooks/:id/cover
PATCH  /api/ebooks/:id/publish
```

Upload request:

```txt
POST /api/ebooks
Content-Type: multipart/form-data

file=<epub|pdf>
cover=<optional image>
title=<optional, fallback filename>
author=<optional>
description=<optional>
language=<optional>
tags=<optional comma separated or JSON array>
status=draft|published
```

Progress request:

```json
{
  "sessionId": "anonymous-session-id",
  "format": "epub",
  "locator": {
    "epubCfi": "epubcfi(...)",
    "href": "chapter-1.xhtml",
    "percentage": 0.23
  },
  "settings": {
    "fontFamily": "serif",
    "fontSize": 18,
    "lineHeight": 1.7,
    "theme": "sepia"
  }
}
```

### Validation

Dùng Zod trong `ebook.validation.js`.

Validate:

- `sessionId` required cho progress/bookmark public.
- `format` nằm trong `epub`, `pdf`.
- `theme` nằm trong `light`, `dark`, `sepia`.
- `fontSize` giới hạn 14-28.
- `lineHeight` giới hạn 1.3-2.2.
- Bookmark label tối đa 120 ký tự.
- Note tối đa 1000 ký tự.

### Service responsibilities

Controller chỉ request/response. Service xử lý:

- Normalize filename và slug.
- Validate file type bằng MIME + extension.
- Upload file.
- Tạo/sửa/xóa ebook.
- Khi xóa ebook, xóa file storage nếu có thể.
- Upsert progress theo `{ ebook, sessionId }`.
- CRUD bookmark theo `{ ebook, sessionId }`.
- Chỉ trả ebook `published` cho public nếu không phải admin.

## Frontend

### Feature folder mới

```txt
client/src/features/ebooks/
├── components/
│   ├── EbookCard.jsx
│   ├── EbookLibraryToolbar.jsx
│   ├── EbookUploadDialog.jsx
│   ├── EbookEditDialog.jsx
│   ├── EbookReaderShell.jsx
│   ├── EpubReader.jsx
│   ├── PdfReader.jsx
│   ├── ReaderSettingsPanel.jsx
│   ├── BookmarkPanel.jsx
│   └── ReadingProgressBar.jsx
├── hooks/
│   ├── useEbooks.js
│   ├── useEbookReader.js
│   └── useReaderPreferences.js
├── pages/
│   ├── EbookLibraryPage.jsx
│   └── EbookReaderPage.jsx
├── services/
│   └── ebookApi.js
└── utils/
    ├── ebookFormat.js
    ├── epubLocator.js
    └── pdfLocator.js
```

### Routes

Thêm vào `client/src/app/router.jsx` trong `MainLayout`:

```jsx
{ path: "ebooks", element: <EbookLibraryPage /> },
{ path: "ebooks/:slug", element: <EbookReaderPage /> },
```

Không thêm route admin riêng. Admin controls render theo rule:

```js
const showAdminControls = user?.role === "admin";
```

### API service

`client/src/features/ebooks/services/ebookApi.js`:

- `listEbooks(params)`
- `getEbook(slug)`
- `createEbook(formData)`
- `updateEbook(id, payload)`
- `deleteEbook(id)`
- `getProgress(id, sessionId)`
- `saveProgress(id, payload)`
- `listBookmarks(id, sessionId)`
- `createBookmark(id, payload)`
- `updateBookmark(id, bookmarkId, payload)`
- `deleteBookmark(id, bookmarkId)`

Dùng `apiClient` hiện có.

### Reader state

State cần có:

- `ebook`
- `format`
- `isLoading`
- `currentLocator`
- `progressPercentage`
- `settings`
- `bookmarks`
- `isSettingsOpen`
- `isBookmarkPanelOpen`

Lưu settings:

- `localStorage` key: `meomeo:ebook-reader-settings`.
- Server progress cũng chứa settings để restore.

Lưu progress:

- Debounce 800-1500ms khi user chuyển trang/cuộn.
- Save ngay khi rời trang bằng `visibilitychange` hoặc cleanup effect nếu có locator mới.

### EPUB reader

Dùng `epubjs` đã có trong dependency.

Yêu cầu:

- Load từ ebook file URL.
- Restore bằng `epubCfi` nếu có.
- Nếu chưa có progress thì mở đầu sách.
- Theo dõi `relocated` event để lấy:
  - `location.start.cfi`
  - `location.start.href`
  - `location.start.percentage`
- Apply theme qua `rendition.themes`.
- Apply font size, font family, line height qua CSS injected.
- Bookmark lưu `epubCfi`.

Lưu ý CORS:

- File URL từ Cloudinary raw cần cho phép browser fetch.
- Nếu gặp CORS/range issue, thêm endpoint proxy `GET /api/ebooks/:id/file` stream file từ server.

### PDF reader

Dùng `pdfjs-dist` đã có trong dependency.

MVP nên làm reader đơn giản:

- Render từng page hoặc virtualize theo trang hiện tại.
- Toolbar:
  - Previous/next page.
  - Page number input.
  - Zoom.
  - Theme overlay cho background.
- Progress locator:
  - `page`.
  - `percentage = page / pageCount`.
  - Có thể thêm `scrollTop` nếu dùng continuous scroll.
- Bookmark lưu page hiện tại.

Không cần annotation PDF trong MVP.

### UI

Thư viện ebook:

- Header ngắn: `Ebooks`.
- Search input.
- Filter format EPUB/PDF.
- Grid/list sách.
- Card hiển thị cover, title, author, format, progress.
- Nếu admin:
  - Button upload.
  - Button edit trên từng card.
  - Toggle publish/draft.
  - Delete confirmation.

Reader:

- Full reading surface, hạn chế card lồng nhau.
- Top toolbar cố định:
  - Back to library.
  - Title.
  - Bookmark.
  - Settings.
  - Bookmarks panel.
- Reading area responsive.
- Bottom hoặc top progress bar.
- Settings panel dùng primitive dialog/select/input/button.
- Theme:
  - Light: canvas sáng theo `DESIGN.MD`.
  - Sepia: surface ấm nhẹ.
  - Dark: dark surface với text sáng.

### Navigation

Cập nhật main navigation nếu đang có nav public:

- Thêm link `Ebooks`.
- Không đặt ebook trong admin dashboard.

## Dependency

Client đã có:

- `epubjs`
- `pdfjs-dist`

Backend hiện có:

- `multer`
- `cloudinary`
- `mongoose`
- `zod`

Có thể chưa cần dependency mới cho MVP.

Nếu muốn trích metadata EPUB server-side ở phase sau:

- Cân nhắc parser EPUB riêng.
- Hoặc để client/admin nhập metadata thủ công trước.

## Bảo mật và kiểm soát file

- Chỉ admin upload/sửa/xóa ebook.
- Public chỉ đọc ebook `published`.
- Validate MIME + extension.
- Giới hạn dung lượng file.
- Không execute hoặc parse HTML EPUB server-side trong MVP.
- Khi render EPUB ở client, dùng khả năng sandbox/iframe của `epubjs`.
- Không cho upload `.html`, `.js`, `.zip` thường.
- Với PDF, render qua PDF.js thay vì nhúng trực tiếp iframe nếu muốn đồng nhất progress/bookmark.

## Triển khai theo giai đoạn

### Giai đoạn 1: Backend foundation

1. Tạo module `ebooks`.
2. Tạo `Ebook`, `EbookProgress`, `EbookBookmark` models.
3. Tạo upload middleware cho EPUB/PDF.
4. Tạo service upload Cloudinary raw.
5. Tạo CRUD ebook public/admin.
6. Tạo progress/bookmark APIs.
7. Đăng ký route `/api/ebooks`.

Tiêu chí hoàn thành:

- Admin upload EPUB/PDF thành công.
- DB có metadata ebook và file URL.
- Public list chỉ thấy sách published.
- Progress/bookmark có thể upsert/list/delete bằng `sessionId`.

### Giai đoạn 2: Ebook library UI

1. Tạo feature folder `ebooks`.
2. Tạo API service và query hooks.
3. Tạo `EbookLibraryPage`.
4. Tạo `EbookCard`.
5. Tạo `EbookUploadDialog`.
6. Tạo inline edit/delete/publish controls cho admin.
7. Thêm route `/ebooks`.

Tiêu chí hoàn thành:

- User public xem danh sách ebook.
- Admin upload và chỉnh metadata trong thư viện.
- Không có route dashboard admin mới.

### Giai đoạn 3: EPUB reader

1. Tạo `EbookReaderPage` và `EbookReaderShell`.
2. Tạo `EpubReader` bằng `epubjs`.
3. Restore vị trí từ localStorage/API.
4. Debounced save progress khi relocated.
5. Settings font size/font/theme/line height.
6. Bookmark theo CFI.
7. Thêm route `/ebooks/:slug`.

Tiêu chí hoàn thành:

- Mở EPUB đọc online.
- Đổi theme/font/cỡ chữ hoạt động.
- Reload trang vẫn quay lại vị trí cũ.
- Bookmark và mở lại bookmark hoạt động.

### Giai đoạn 4: PDF reader

1. Tạo `PdfReader` bằng `pdfjs-dist`.
2. Render page hiện tại hoặc continuous pages.
3. Toolbar chuyển trang/zoom.
4. Restore page gần nhất.
5. Bookmark theo page.
6. Save progress theo page.

Tiêu chí hoàn thành:

- Mở PDF đọc online.
- Reload vẫn quay lại page cũ.
- Bookmark page hoạt động.

### Giai đoạn 5: QA và hoàn thiện

1. Kiểm thử file EPUB/PDF nhỏ và lớn.
2. Kiểm thử upload sai định dạng.
3. Kiểm thử admin/public visibility.
4. Kiểm thử mobile layout.
5. Kiểm thử CORS file URL.
6. Chạy build client.
7. Chạy server smoke test.

## Acceptance checklist

- Public user vào `/ebooks` không cần login.
- Public user đọc được EPUB/PDF published.
- Admin đăng nhập thấy inline controls trong `/ebooks`.
- Admin upload EPUB/PDF thành công.
- Admin sửa metadata ebook thành công.
- Admin publish/unpublish ebook thành công.
- File sai định dạng bị từ chối.
- Reader EPUB đổi font size/font/theme/line height được.
- Reader PDF chuyển trang và zoom được.
- Bookmark tạo/xóa/mở lại được.
- Vị trí đọc được lưu và restore sau khi reload.
- Không có student login mới.
- Không có admin dashboard riêng cho ebook MVP.

## Rủi ro cần xử lý sớm

- Cloudinary raw file có thể gặp vấn đề CORS hoặc range request với PDF/EPUB. Nếu xảy ra, dùng server proxy endpoint `/api/ebooks/:id/file`.
- EPUB từ nguồn không chuẩn có thể thiếu metadata hoặc cover. MVP nên cho admin nhập metadata thủ công.
- PDF lớn render chậm nếu render tất cả trang cùng lúc. MVP nên render page hiện tại hoặc lazy render.
- Progress EPUB phụ thuộc CFI, nếu file bị thay thế thì bookmark/progress cũ có thể không còn đúng.
- Một số trình duyệt gửi EPUB MIME là `application/octet-stream`; validation cần kiểm tra thêm extension.

## Thứ tự ưu tiên đề xuất

1. Backend ebook upload và metadata.
2. Public ebook library với admin inline upload.
3. EPUB reader đầy đủ settings/progress/bookmark.
4. PDF reader settings/progress/bookmark.
5. Polish UI và xử lý edge cases.
