# BA - Tính năng nghe nhạc, xem phim song ngữ

Ngày lập: 2026-06-25

## 1. Mục tiêu

Bổ sung chế độ học mới cho Meomeo: người học có thể xem video YouTube dạng phim, nhạc, hội thoại hoặc bài học với phụ đề song ngữ Anh - Việt đồng bộ theo thời gian.

Tính năng này phải dùng chung thư viện video YouTube hiện có. Học sinh không cần đăng nhập. Admin là vai trò đăng nhập duy nhất và các nút quản trị phải hiển thị inline trong giao diện học, không tạo dashboard admin riêng cho MVP.

Tên đề xuất:

- Nhãn UI: `Video song ngữ`
- Route đề xuất: `/videos/:id/bilingual`
- Nếu muốn dùng chung page hiện tại: `/videos/:id?mode=bilingual`
- Frontend feature folder: `client/src/features/bilingual`
- Backend module đề xuất: `server/src/modules/bilingual`

## 2. Phân tích ảnh tham chiếu

### Desktop

Giao diện desktop trong ảnh có 2 cột:

- Cột trái là player video lớn, chiếm phần lớn chiều ngang.
- Cột phải là danh sách phụ đề song ngữ, có scroll riêng.
- Mỗi segment phụ đề gồm:
  - Dòng tiếng Anh.
  - Dòng tiếng Việt.
  - Badge thời gian ở mép phải, ví dụ `00:15`.
- Các segment được ngăn bằng border mảnh.
- Segment đang phát cần được highlight nhẹ.
- Player ưu tiên trải nghiệm xem liên tục, không phải luyện từng câu như Dictation/Shadowing.

### Mobile

Giao diện mobile trong ảnh có layout dọc:

- Player nằm trên cùng, full width.
- Danh sách phụ đề song ngữ nằm ngay dưới player.
- Badge thời gian nằm bên phải của từng segment.
- Không dùng panel phụ riêng trên mobile.
- Toolbar/header cần gọn, tránh chiếm chiều cao màn hình.

## 3. Hiện trạng dự án

### 3.1 Backend

Dự án hiện có các module chính đúng với MVP YouTube Shadowing/Dictation:

- `auth`: đăng nhập admin bằng JWT.
- `topics`: quản lý topic công khai và inline admin.
- `videos`: quản lý `VideoLesson`, thêm video YouTube, phân tích lại transcript.
- `youtube`: dùng `yt-dlp-exec` để lấy metadata và subtitle tiếng Anh.
- `transcripts`: CRUD transcript segment.
- `dictation`: kiểm tra câu trả lời dựa trên `TranscriptSegment.text`.
- `shadowing`: ghi âm và chấm phát âm bằng Azure Speech dựa trên `TranscriptSegment.text`.
- `speech`, `media`: module phụ trợ audio/media. `media/openaiTts.service.js` đã dùng package `openai`.

Các module cũ vẫn tồn tại nhưng không nên mở rộng cho tính năng này:

- `courses`
- `vocabulary`
- `grammar`
- `exercises`
- `progress`
- `users`

Tính năng song ngữ nên bám vào model MVP mới: `VideoLesson` và `TranscriptSegment`.

### 3.2 Frontend

Frontend hiện dùng:

- React + Vite.
- React Router.
- TanStack Query.
- Zustand auth store.
- shadcn/ui primitives trong `client/src/components/ui`.

Màn hình liên quan:

- `client/src/features/videos/pages/VideoLibraryPage.jsx`
  - Hiển thị thư viện video.
  - Admin thêm, xóa, publish/unpublish video inline.
  - Khi click video, hiện dialog chọn mode `dictation` hoặc `shadowing`.
- `client/src/features/videos/pages/VideoLearningPage.jsx`
  - Gom state player, current segment, transcript, admin edit cho Dictation/Shadowing.
- `client/src/features/videos/components/SegmentYoutubePlayer.jsx`
  - Load YouTube Iframe API.
  - Expose qua ref: `playSegment`, `playFrom`, `pauseVideo`.
  - Đang có timer dừng tại `endTime` khi phát từng segment.

Cần mở rộng `SegmentYoutubePlayer` để hỗ trợ chế độ xem liên tục:

- Thêm prop `continuous`.
- Thêm callback `onTimeChange(currentTime)`.
- Khi `continuous = true`, không dừng tại `segment.endTime`.
- Giữ nguyên behavior hiện tại cho Dictation/Shadowing.

## 4. Phân tích model hiện có và thay đổi cần thêm

### 4.1 User

File: `server/src/modules/users/user.model.js`

Hiện có:

```js
{
  name,
  email,
  username,
  passwordHash,
  role: "admin" | "student",
  isActive
}
```

Theo định hướng MVP, chỉ dùng admin. Không thêm student login cho tính năng song ngữ.

### 4.2 Topic

File: `server/src/modules/topics/topic.model.js`

Hiện có:

```js
{
  name,
  slug,
  description,
  order,
  isPublished
}
```

Không bắt buộc thay đổi. Nếu sau này muốn phân loại phim/nhạc, có thể dùng topic hiện có.

### 4.3 VideoLesson

File: `server/src/modules/videos/video.model.js`

Hiện có:

```js
{
  topicId,
  youtubeUrl,
  youtubeVideoId,
  title,
  description,
  thumbnailUrl,
  duration,
  level,
  source,
  transcriptStatus,
  transcriptLanguage,
  transcriptError,
  viewCount,
  studyCount,
  isPublished,
  createdBy
}
```

Cần bổ sung các field cho tính năng song ngữ:

```js
{
  contentType: {
    type: String,
    enum: ["lesson", "music", "movie", "other"],
    default: "lesson"
  },
  bilingualStatus: {
    type: String,
    enum: ["none", "pending", "processing", "completed", "failed"],
    default: "none"
  },
  bilingualSourceLanguage: { type: String, default: "en" },
  bilingualTargetLanguage: { type: String, default: "vi" },
  bilingualModel: { type: String, default: "" },
  bilingualError: { type: String, default: "" },
  bilingualGeneratedAt: { type: Date }
}
```

Ghi chú:

- `contentType` hỗ trợ lọc loại nội dung sau này: bài học, nhạc, phim, nội dung khác.
- `bilingualStatus` giúp UI biết video đã có Vietsub chưa.
- Không lưu text dịch trong `VideoLesson`; text dịch thuộc từng `TranscriptSegment`.

### 4.4 TranscriptSegment

File: `server/src/modules/transcripts/transcriptSegment.model.js`

Hiện có:

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
  source,
  isPublished
}
```

Cần bổ sung:

```js
{
  translationText: { type: String, default: "", trim: true },
  translationLanguage: { type: String, default: "vi" },
  translationStatus: {
    type: String,
    enum: ["none", "translated", "edited", "failed"],
    default: "none"
  },
  translationError: { type: String, default: "" },
  translatedAt: { type: Date }
}
```

Index đề xuất:

```js
transcriptSegmentSchema.index({ videoId: 1, translationStatus: 1 });
```

Lý do thêm trực tiếp vào `TranscriptSegment`:

- Segment đã là đơn vị subtitle/timeline dùng cho Dictation và Shadowing.
- UI song ngữ cần English + Vietnamese trên cùng một timeline.
- Admin có thể sửa transcript tiếng Anh và bản dịch tiếng Việt trong cùng một form.
- Đơn giản hơn cho MVP, không cần collection phụ.

Rủi ro cần xử lý:

- `createTranscriptSegments(videoId, ...)` hiện đang `deleteMany({ videoId })` trước khi insert lại.
- Nếu admin phân tích lại transcript, toàn bộ Vietsub cũ sẽ mất.
- Khi video đã có `bilingualStatus = "completed"`, UI nên confirm trước khi cho phân tích lại transcript.

### 4.5 DictationAttempt

File: `server/src/modules/dictation/dictationAttempt.model.js`

Không cần thay đổi. Dictation vẫn dùng `TranscriptSegment.text` tiếng Anh.

### 4.6 ShadowingAttempt

File: `server/src/modules/shadowing/shadowingAttempt.model.js`

Không cần thay đổi. Shadowing vẫn chấm phát âm theo `TranscriptSegment.text` tiếng Anh.

## 5. Yêu cầu nghiệp vụ

### 5.1 Người học

Người học có thể:

1. Mở thư viện video công khai mà không cần đăng nhập.
2. Chọn video và chọn chế độ `Xem song ngữ`.
3. Xem video YouTube trực tiếp bằng YouTube iframe.
4. Xem danh sách phụ đề song ngữ Anh - Việt.
5. Khi video đang phát, segment subtitle hiện tại được highlight.
6. Click vào một segment subtitle để seek video đến `startTime` của segment đó.
7. Dùng tốt trên desktop và mobile theo layout ảnh tham chiếu.

### 5.2 Admin

Admin có thể:

1. Thêm video YouTube theo luồng hiện tại.
2. Bấm `Phân tích transcript` nếu video chưa có transcript.
3. Bấm `Tạo Vietsub` để dịch transcript tiếng Anh sang tiếng Việt bằng OpenAI.
4. Xem trạng thái đang dịch, thành công hoặc thất bại.
5. Sửa text tiếng Anh và text tiếng Việt của từng segment.
6. Tạo lại Vietsub khi transcript thay đổi.
7. Publish/unpublish video như hiện có.

### 5.3 Điều kiện tạo Vietsub

Admin chỉ tạo Vietsub khi:

- Video tồn tại.
- Người gọi đã đăng nhập và có role `admin`.
- `video.transcriptStatus = "completed"`.
- Video có ít nhất 1 `TranscriptSegment`.

Nếu không đạt điều kiện, backend trả `400` với message rõ ràng:

```txt
Cannot generate Vietnamese subtitles before transcript is completed
```

### 5.4 Điều kiện hiển thị cho public user

Public user chỉ thấy:

- Video có `isPublished = true`.
- Segment có `isPublished = true`.
- Bản dịch nếu `translationStatus` là `translated` hoặc `edited`.

Nếu video chưa có Vietsub:

- Vẫn cho xem video và phụ đề tiếng Anh.
- Hiển thị thông báo nhỏ: `Video này chưa có phụ đề tiếng Việt.`
- Không hiển thị nút admin.

## 6. Cấu hình môi trường

Backend `.env` cần bổ sung:

```env
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=gpt-5.4-nano-2026-03-17
OPENAI_TRANSLATION_TARGET_LANGUAGE=vi
```

Cập nhật `server/src/config/env.js`:

```js
openAi: {
  apiKey: process.env.OPENAI_API_KEY || "",
  ttsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  ttsVoice: process.env.OPENAI_TTS_VOICE || "alloy",
  translationModel: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.4-nano-2026-03-17",
  translationTargetLanguage: process.env.OPENAI_TRANSLATION_TARGET_LANGUAGE || "vi",
}
```

Không hardcode model trong service. Luôn đọc từ `config.openAi.translationModel`.

## 7. Thiết kế backend

### 7.1 Module mới

Tạo module theo chuẩn dự án:

```txt
server/src/modules/bilingual/
├── bilingual.routes.js
├── bilingual.controller.js
├── bilingual.service.js
└── bilingual.validation.js
```

Không cần model riêng trong MVP nếu bản dịch được lưu trong `TranscriptSegment`.

Đăng ký route trong `server/src/routes/index.js`:

```js
import bilingualRoutes from "../modules/bilingual/bilingual.routes.js";
router.use("/bilingual", bilingualRoutes);
```

Vì endpoint gắn trực tiếp với video, agent code cũng có thể đặt route trong `videos.routes.js` để scope nhỏ hơn. Tuy nhiên logic dịch nên để trong `bilingual.service.js` để dễ bảo trì.

### 7.2 API public: lấy dữ liệu song ngữ

Endpoint:

```http
GET /api/videos/:id/bilingual
```

Middleware:

- `optionalAuth`
- validate params bằng Zod.

Response:

```js
{
  video: {
    _id,
    title,
    youtubeUrl,
    youtubeVideoId,
    thumbnailUrl,
    duration,
    level,
    transcriptStatus,
    bilingualStatus,
    bilingualSourceLanguage,
    bilingualTargetLanguage,
    bilingualGeneratedAt
  },
  segments: [
    {
      _id,
      index,
      startTime,
      endTime,
      duration,
      text,
      translationText,
      translationLanguage,
      translationStatus,
      isPublished
    }
  ]
}
```

Quyền truy cập:

- Public user chỉ lấy được video published và segment published.
- Admin có token hợp lệ được xem cả unpublished.

### 7.3 API admin: tạo Vietsub

Endpoint:

```http
POST /api/videos/:id/generate-vietsub
```

Middleware:

- `requireAuth`
- `requireRole("admin")`
- validate params/body bằng Zod.

Body:

```js
{
  force: false,
  targetLanguage: "vi"
}
```

Response thành công:

```js
{
  video,
  translatedCount,
  failedCount,
  segments
}
```

Quy tắc:

- Nếu `force = false`, chỉ dịch các segment chưa có `translationText`, hoặc có `translationStatus` là `none`/`failed`.
- Nếu `force = true`, dịch lại toàn bộ segment published của video.
- Trước khi gọi OpenAI, set `video.bilingualStatus = "processing"`.
- Nếu có ít nhất một segment dịch thành công, set `video.bilingualStatus = "completed"`.
- Nếu không dịch được segment nào, set `video.bilingualStatus = "failed"` và lưu `bilingualError`.

### 7.4 API admin: sửa bản dịch từng segment

Mở rộng endpoint hiện có:

```http
PATCH /api/transcripts/:segmentId
```

Body mới:

```js
{
  text,
  translationText,
  startTime,
  endTime,
  isPublished
}
```

Khi `translationText` được update:

- Nếu không rỗng: `translationStatus = "edited"`.
- Nếu rỗng: `translationStatus = "none"`.
- `translationError = ""`.
- `translatedAt = new Date()` nếu có text dịch.

### 7.5 Service OpenAI dịch subtitle

Tạo file:

```txt
server/src/modules/bilingual/openaiTranslation.service.js
```

Yêu cầu:

- Dùng package `openai` đã có trong `server/package.json`.
- Check `config.openAi.apiKey`. Nếu thiếu, trả lỗi `500 OPENAI_API_KEY is not configured`.
- Model lấy từ `config.openAi.translationModel`.
- Dịch theo batch để tiết kiệm request. Batch size đề xuất: 30-50 segment/request.
- Không tự tách/gộp segment.
- Mapping kết quả bằng `_id`, không chỉ dựa vào thứ tự mảng.

System prompt đề xuất:

```txt
You translate English video subtitles into natural Vietnamese for language learners.
Keep meaning faithful, concise, and subtitle-friendly.
Do not add explanations.
Return only valid JSON matching the requested schema.
```

User payload:

```json
{
  "targetLanguage": "vi",
  "segments": [
    { "id": "segmentObjectId", "index": 1, "text": "This is the story..." }
  ]
}
```

Expected JSON:

```json
{
  "translations": [
    { "id": "segmentObjectId", "index": 1, "translationText": "Đây là câu chuyện..." }
  ]
}
```

Validation sau khi nhận OpenAI:

- Parse JSON nghiêm ngặt.
- Segment nào không có translation hợp lệ thì mark `translationStatus = "failed"` và lưu `translationError`.
- Không update `text` tiếng Anh từ output của OpenAI.

### 7.6 Pseudocode `generateVietsub`

```js
export async function generateVietsub(videoId, options = {}) {
  const video = await VideoLesson.findById(videoId);
  if (!video) throw createHttpError(404, "Video not found");

  if (video.transcriptStatus !== "completed") {
    throw createHttpError(400, "Cannot generate Vietnamese subtitles before transcript is completed");
  }

  const filter = { videoId: video._id, isPublished: true };

  if (!options.force) {
    filter.$or = [
      { translationText: "" },
      { translationText: { $exists: false } },
      { translationStatus: { $in: ["none", "failed"] } },
    ];
  }

  const segments = await TranscriptSegment.find(filter).sort({ index: 1 });
  if (!segments.length) {
    throw createHttpError(400, "No transcript segments need translation");
  }

  video.bilingualStatus = "processing";
  video.bilingualError = "";
  video.bilingualModel = config.openAi.translationModel;
  await video.save();

  try {
    const result = await translateSegmentsInBatches(segments, {
      targetLanguage: options.targetLanguage || config.openAi.translationTargetLanguage,
    });

    video.bilingualStatus = result.translatedCount > 0 ? "completed" : "failed";
    video.bilingualGeneratedAt = new Date();
    video.bilingualError = result.translatedCount > 0 ? "" : "No subtitles were translated";
    await video.save();

    return { video, ...result };
  } catch (error) {
    video.bilingualStatus = "failed";
    video.bilingualError = error.message;
    await video.save();
    throw error;
  }
}
```

## 8. Thiết kế frontend

### 8.1 Route và folder

Cập nhật `client/src/app/router.jsx`:

```js
{ path: "videos/:id/bilingual", element: <BilingualWatchPage /> }
```

Tạo folder:

```txt
client/src/features/bilingual/
├── pages/BilingualWatchPage.jsx
├── components/BilingualSubtitleList.jsx
├── components/BilingualAdminToolbar.jsx
├── services/bilingualApi.js
└── hooks/useBilingualWatch.js
```

### 8.2 Thêm mode trong thư viện video

Cập nhật `VideoLibraryPage.jsx`:

- Dialog `LearningModeDialog` thêm card thứ ba.
- Icon đề xuất: `Languages` hoặc `Clapperboard` từ `lucide-react`.
- Title: `Xem song ngữ`.
- Mode: `bilingual`.

Trong `startLearning(mode)`:

```js
if (mode === "bilingual") {
  navigate(`/videos/${modePickerVideo._id}/bilingual`);
  return;
}

navigate(`/videos/${modePickerVideo._id}?mode=${mode}`);
```

### 8.3 Layout desktop

UI mới phải dùng shadcn/ui trước:

- `Button`
- `Badge`
- `Card`
- `Alert`
- `Textarea`
- `Input`
- `Dialog`

Không tạo button/input/modal custom Tailwind nếu shadcn primitive đã có.

Layout đề xuất:

```txt
section full height bg-cream-soft
└── div xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)]
    ├── main player column
    │   ├── title/admin toolbar
    │   └── YouTube player large
    └── aside subtitle column
        └── scrollable subtitle list
```

Behavior:

- Desktop: player bên trái, subtitle bên phải.
- Subtitle panel: `max-h-[calc(100vh-5rem)] overflow-y-auto`.
- Segment active dùng nền `cream-soft`, border hoặc ring màu `coral`.

### 8.4 Layout mobile

Layout mobile:

```txt
section bg-canvas
├── sticky/top player
└── subtitle list full width
```

Player:

- Fixed aspect ratio.
- Nằm trên danh sách phụ đề.
- Không overlay phụ đề lên video trong MVP.

Subtitle item:

```txt
English text
Vietnamese text
                 [00:15]
```

Behavior:

- Danh sách phụ đề scroll theo trang.
- Active segment tự scroll vào vùng nhìn thấy khi playback đổi segment.
- Text không được overlap với badge thời gian.

### 8.5 Đồng bộ subtitle với player

Cần sửa `SegmentYoutubePlayer.jsx`.

Props mới:

```js
onTimeChange?: (currentTime) => void
continuous?: boolean
```

Behavior:

- Khi `continuous = true`, không dừng ở `segment.endTime`.
- Khi player state là PLAYING, tạo interval 250ms:

```js
onTimeChange?.(player.getCurrentTime());
```

- Khi pause/end/destroy, clear interval.
- `playSegment()` vẫn giữ logic dừng tại `endTime` cho Dictation/Shadowing.

Trong `BilingualWatchPage`:

```js
const activeIndex = segments.findIndex((segment) => {
  return currentTime >= segment.startTime && currentTime < segment.endTime;
});
```

Click subtitle:

```js
playerRef.current?.playFrom(segment.startTime);
```

### 8.6 Admin toolbar

Nếu `user?.role === "admin"`:

- Hiện nút `Phân tích transcript`.
- Hiện nút `Tạo Vietsub` khi chưa có bản dịch.
- Hiện nút `Tạo lại Vietsub` khi đã có bản dịch.
- Hiện badge trạng thái:
  - `Transcript: completed/failed/processing`
  - `Vietsub: none/processing/completed/failed`
- Nếu có `video.bilingualError`, hiển thị `Alert`.

Disable `Tạo Vietsub` khi:

- Transcript chưa completed.
- Mutation đang pending.
- Không có segment.

### 8.7 Admin edit subtitle

MVP nên hỗ trợ edit inline từng segment:

- Click icon `Pencil`.
- Mở `Dialog` hoặc expand form tại item.
- Form gồm:
  - `Textarea` tiếng Anh.
  - `Textarea` tiếng Việt.
  - `Input` startTime.
  - `Input` endTime.
  - Save/Cancel bằng `Button`.
- Save gọi `PATCH /api/transcripts/:segmentId`.

## 9. Frontend API và hooks

Tạo file:

```txt
client/src/features/bilingual/services/bilingualApi.js
```

```js
import { apiClient } from "../../../services/apiClient.js";

export function getBilingualVideo(id) {
  return apiClient.get(`/videos/${id}/bilingual`);
}

export function generateVietsub(id, data) {
  return apiClient.post(`/videos/${id}/generate-vietsub`, data);
}
```

Tạo hook:

```txt
client/src/features/bilingual/hooks/useBilingualWatch.js
```

Query keys:

- `["bilingual-video", id]`
- Khi tạo Vietsub thành công, invalidate:
  - `["bilingual-video", id]`
  - `["video", id]`
  - `["video-transcripts", id]`

## 10. Tiêu chí nghiệm thu

### Public user

1. User không đăng nhập mở `/videos/:id/bilingual` với video published thì xem được player YouTube.
2. Phụ đề tiếng Anh hiển thị theo segment.
3. Nếu đã tạo Vietsub, mỗi segment hiển thị thêm dòng tiếng Việt.
4. Khi video đang phát, subtitle active highlight đúng theo current time.
5. Click subtitle seek video về đúng `startTime`.
6. Desktop hiển thị player trái, subtitle phải như ảnh tham chiếu.
7. Mobile hiển thị player trên, subtitle dưới như ảnh tham chiếu.

### Admin

1. Admin thấy nút `Tạo Vietsub`.
2. Admin bấm `Tạo Vietsub`, backend gọi OpenAI model từ env `OPENAI_TRANSLATION_MODEL`.
3. Sau khi thành công, `VideoLesson.bilingualStatus = "completed"`.
4. Các segment có `translationText`.
5. Admin sửa được subtitle tiếng Việt từng segment.
6. Nếu OpenAI lỗi, UI hiển thị message từ `video.bilingualError`.
7. Admin không tạo Vietsub được khi transcript chưa completed.

### Regression

1. Dictation vẫn phát từng segment và dừng tại `endTime`.
2. Shadowing vẫn ghi âm và chấm điểm theo `TranscriptSegment.text`.
3. Add video, publish/unpublish, analyze transcript không bị lỗi.
4. Public API không trả unpublished video cho guest.

## 11. Test plan

### Backend

1. Tạo video YouTube bằng endpoint hiện có.
2. Kiểm tra transcript segments được lưu.
3. Gọi `POST /api/videos/:id/generate-vietsub` với admin token.
4. Kiểm tra MongoDB:
   - `VideoLesson.bilingualStatus`
   - `VideoLesson.bilingualModel`
   - `TranscriptSegment.translationText`
   - `TranscriptSegment.translationStatus`
5. Gọi `GET /api/videos/:id/bilingual` không token.
6. Gọi với unpublished video không token phải trả 404.
7. Gọi với admin token phải xem được unpublished video.

### Frontend

1. Chạy `npm run build` trong `client`.
2. Mở thư viện video, click video, chọn `Xem song ngữ`.
3. Kiểm tra desktop 1440px:
   - Player lớn bên trái.
   - Subtitle bên phải scroll được.
   - Active segment highlight đúng.
4. Kiểm tra mobile 360px:
   - Player nằm trên.
   - Subtitle nằm dưới.
   - Không overlap text/control.
5. Admin login:
   - Nút `Tạo Vietsub` hiển thị.
   - Loading state đúng.
   - Error state đúng.

## 12. Checklist triển khai cho agent code

Làm theo thứ tự:

1. Cập nhật env/config:
   - Thêm `OPENAI_TRANSLATION_MODEL`.
   - Thêm `OPENAI_TRANSLATION_TARGET_LANGUAGE`.
2. Cập nhật `VideoLesson` model:
   - Thêm fields bilingual.
3. Cập nhật `TranscriptSegment` model:
   - Thêm fields translation.
4. Cập nhật transcript validation/service:
   - Cho `PATCH /transcripts/:segmentId` nhận `translationText`.
   - Set `translationStatus = "edited"` khi admin sửa bản dịch.
5. Tạo backend service dịch:
   - Dùng OpenAI SDK.
   - Batch translate.
   - Parse JSON và update segments theo id.
6. Tạo endpoints:
   - `GET /api/videos/:id/bilingual`.
   - `POST /api/videos/:id/generate-vietsub`.
7. Cập nhật frontend API/hook.
8. Mở rộng `SegmentYoutubePlayer` cho continuous playback time tracking.
9. Tạo `BilingualWatchPage`.
10. Thêm card `Xem song ngữ` vào mode dialog của thư viện.
11. Thêm admin toolbar và inline edit Vietsub.
12. Chạy build/test và kiểm tra regression Dictation/Shadowing.

## 13. Lưu ý chất lượng code

- Controller chỉ xử lý request/response.
- Service chứa business logic.
- Route chỉ khai báo endpoint/middleware.
- Validate params/body/query bằng Zod.
- Không tạo student login.
- Không tạo admin dashboard riêng.
- UI mới dùng shadcn/ui primitives trước, Tailwind chỉ dùng cho layout/spacing/responsive.
- Không hardcode màu theme rải rác; dùng token hiện có như `canvas`, `cream`, `coal`, `coral`.
- Không hardcode OpenAI model trong service.
- Không gọi OpenAI từ frontend.
- Không dịch lại toàn bộ nếu `force = false` và segment đã có `translationText`.
- Khi `analyze-transcript` xóa/recreate segments, cần cảnh báo admin nếu video đã có Vietsub.
