# Meomeo TOEIC - YouTube Shadowing & Dictation Learning App

Website luyện nghe tiếng Anh qua video YouTube, tập trung vào hai chế độ học chính:

- Dictation: nghe và gõ lại nội dung nghe được.
- Shadowing: nghe, bắt chước phát âm và được chấm điểm bằng AI.

Học sinh không cần đăng nhập. Admin là giáo viên, cần đăng nhập để thêm video, phân tích transcript, chỉnh sửa transcript và quản lý nội dung học. Không có dashboard admin riêng trong MVP; khi admin đăng nhập, website hiển thị thêm nút quản lý trực tiếp trên giao diện học.

## Mục Tiêu

Meomeo giúp học sinh luyện nghe, luyện phát âm và phản xạ tiếng Anh thông qua video YouTube theo nhiều chủ đề. Admin nhập URL YouTube, hệ thống lấy metadata bằng `yt-dlp` hoặc `yt-dlp-exec`, lưu video vào MongoDB, sau đó transcript được chia thành nhiều segment để học sinh luyện Dictation và Shadowing.

## Chức Năng Chính

Phía học sinh:

- Xem danh sách chủ đề video.
- Xem danh sách video theo chủ đề, level và từ khóa.
- Xem thumbnail, tiêu đề, level, duration, view/study count.
- Học Dictation với ba mode: Easy, Normal, Hard.
- Học Shadowing theo từng transcript segment.
- Ẩn/hiện transcript.
- Chuyển segment trước/sau.
- Nghe lại từng câu bằng YouTube player theo `startTime`.

Phía admin:

- Đăng nhập bằng tài khoản admin.
- Thêm topic.
- Thêm video bằng YouTube URL.
- Publish/unpublish video.
- Xóa video.
- Phân tích lại transcript.
- Sửa text transcript.
- Sửa start/end time.
- Ghép segment hiện tại với segment kế tiếp.

Tài khoản admin mặc định:

```txt
username: admin
password: 1234567
```

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router DOM
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios

Backend:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Zod
- Multer
- yt-dlp / yt-dlp-exec
- Azure Speech SDK, dùng ở phase Shadowing scoring

## Cấu Trúc Thư Mục

```txt
meomeo/
├── client/
├── server/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

Frontend:

```txt
client/src/
├── app/
├── components/
│   ├── common/
│   ├── layout/
│   ├── video/
│   ├── transcript/
│   └── learning/
├── features/
│   ├── auth/
│   ├── topics/
│   ├── videos/
│   ├── dictation/
│   ├── shadowing/
│   ├── transcript/
│   └── admin-inline/
├── services/
├── hooks/
├── utils/
└── main.jsx
```

Backend:

```txt
server/src/
├── config/
├── modules/
│   ├── auth/
│   ├── topics/
│   ├── videos/
│   ├── transcripts/
│   ├── dictation/
│   ├── shadowing/
│   ├── speech/
│   └── youtube/
├── middlewares/
├── routes/
├── utils/
├── app.js
└── server.js
```

Backend modules follow:

```txt
module-name/
├── module-name.model.js
├── module-name.routes.js
├── module-name.controller.js
├── module-name.service.js
└── module-name.validation.js
```

## Database Models

### User

Chỉ dùng cho admin.

```js
{
  name,
  email,
  username,
  passwordHash,
  role: "admin",
  isActive,
  createdAt,
  updatedAt
}
```

### Topic

```js
{
  name,
  slug,
  description,
  order,
  isPublished,
  createdAt,
  updatedAt
}
```

### VideoLesson

```js
{
  topicId,
  youtubeUrl,
  youtubeVideoId,
  title,
  description,
  thumbnailUrl,
  duration,
  level: "A1" | "A2" | "B1" | "B2" | "C1",
  source: "youtube",
  transcriptStatus: "pending" | "processing" | "completed" | "failed",
  transcriptLanguage,
  viewCount,
  studyCount,
  isPublished,
  createdBy,
  createdAt,
  updatedAt
}
```

### TranscriptSegment

```js
{
  videoId,
  index,
  startTime,
  endTime,
  duration,
  text,
  normalizedText,
  wordCount,
  source: "youtube" | "manual" | "edited",
  isPublished,
  createdAt,
  updatedAt
}
```

### DictationAttempt

```js
{
  sessionId,
  videoId,
  segmentId,
  difficulty: "easy" | "normal" | "hard",
  userAnswer,
  correctText,
  isCorrect,
  score,
  mistakes,
  createdAt
}
```

### ShadowingAttempt

```js
{
  sessionId,
  videoId,
  segmentId,
  referenceText,
  audioUrl,
  pronunciationScore,
  accuracyScore,
  fluencyScore,
  completenessScore,
  passed,
  azureResult,
  createdAt
}
```

## API Chính

Auth:

```txt
POST /api/auth/login
GET  /api/auth/me
```

Topics:

```txt
GET    /api/topics
GET    /api/topics/:slug/videos
POST   /api/topics
PATCH  /api/topics/:id
DELETE /api/topics/:id
```

Videos:

```txt
GET    /api/videos
GET    /api/videos/:id
GET    /api/videos/:id/transcripts
POST   /api/videos
PATCH  /api/videos/:id
DELETE /api/videos/:id
POST   /api/videos/:id/analyze-transcript
PATCH  /api/videos/:id/publish
```

YouTube:

```txt
POST /api/youtube/analyze
```

Transcript:

```txt
PATCH  /api/transcripts/:segmentId
POST   /api/transcripts/:segmentId/merge-next
POST   /api/transcripts/reorder
DELETE /api/transcripts/:segmentId
```

Dictation:

```txt
POST /api/dictation/check
```

Shadowing:

```txt
POST /api/shadowing/assess
```

## Environment Variables

`server/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://...

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=southeastasia

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=1234567
```

`client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Cài Đặt

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Seed admin:

```bash
npm run seed:users --prefix server
```

Run hot reload:

```bash
npm run dev
```

Frontend:

```txt
http://localhost:5173
```

Backend health:

```txt
GET http://localhost:5000/api/health
```

## Cài yt-dlp

Backend cần `yt-dlp` để lấy metadata/transcript tốt hơn.

```bash
pip install yt-dlp
```

Hoặc dùng package Node:

```bash
npm install yt-dlp-exec --prefix server
```

Nếu môi trường local thiếu binary `python`, có thể cài package bằng `--ignore-scripts` và cài `yt-dlp` hệ thống riêng.

## Luồng Admin Thêm Video

```txt
Admin đăng nhập
↓
Admin bấm "Thêm video"
↓
Nhập YouTube URL, topic, level
↓
Backend dùng yt-dlp lấy metadata/transcript
↓
Backend chuẩn hóa transcript thành segment
↓
Admin xem lại transcript
↓
Admin chỉnh text/thời gian nếu cần
↓
Admin publish video
↓
Học sinh thấy video ngoài trang học
```

## Luồng Học Dictation

```txt
Học sinh chọn video
↓
Chọn Dictation
↓
Chọn Easy / Normal / Hard
↓
Hệ thống phát video theo segment
↓
Học sinh gõ nội dung nghe được
↓
Backend so sánh với transcript gốc
↓
Hiển thị điểm, đúng/sai, lỗi sai
↓
Chuyển segment tiếp theo
```

## Luồng Học Shadowing

```txt
Học sinh chọn video
↓
Chọn Shadowing
↓
Hệ thống phát video theo segment
↓
Học sinh nghe và bắt chước
↓
Học sinh ghi âm
↓
Backend gửi audio lên Azure Speech
↓
Azure trả điểm phát âm
↓
Hệ thống hiển thị điểm
```

## MVP Phases

Phase 1:

- Auth admin.
- Public layout.
- Topic/video list.
- Inline admin controls.

Phase 2:

- CRUD topic.
- CRUD video bằng YouTube URL.
- Lấy metadata bằng yt-dlp.
- Lưu video vào MongoDB.

Phase 3:

- Transcript segments.
- Sửa text/time.
- Merge segment.
- Publish/unpublish.

Phase 4:

- Dictation Easy/Normal/Hard.
- Check đáp án.
- Lưu attempt theo `sessionId`.

Phase 5:

- Browser recording.
- Upload audio.
- Azure Speech Pronunciation Assessment.
- Hiển thị điểm shadowing.

## Ghi Chú Kỹ Thuật

- Học sinh không cần đăng nhập.
- Attempts dùng `sessionId` anonymous trong localStorage.
- Transcript nên lưu trong MongoDB sau khi lấy từ YouTube.
- MVP không tải video YouTube về server, chỉ embed player và điều khiển theo `startTime`.
- Admin controls render điều kiện theo `user?.role === "admin"`.
