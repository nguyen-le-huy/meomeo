# Plan triển khai tính năng Video song ngữ

Tài liệu nguồn: [bilingual-music-movie-feature-analysis.md](./bilingual-music-movie-feature-analysis.md)

Mục tiêu của plan này là hướng dẫn agent code triển khai đúng thứ tự, đúng module, không phá luồng Dictation/Shadowing hiện có.

## Nguyên tắc bắt buộc

1. Không tạo student login.
2. Không tạo admin dashboard riêng.
3. Admin controls phải nằm inline trong public learning UI.
4. Backend giữ chuẩn module:

```txt
module-name/
├── module-name.routes.js
├── module-name.controller.js
├── module-name.service.js
└── module-name.validation.js
```

5. Controller chỉ xử lý request/response.
6. Service chứa business logic.
7. Route chỉ khai báo endpoint và middleware.
8. Validate params/body/query bằng Zod.
9. UI mới phải dùng shadcn/ui primitives trước: `Button`, `Input`, `Textarea`, `Dialog`, `Card`, `Badge`, `Alert`, `Select`.
10. Tailwind chỉ dùng cho layout, spacing, responsive và tinh chỉnh nhỏ.
11. Không hardcode OpenAI model trong code. Luôn đọc từ `.env`.
12. Không gọi OpenAI từ frontend.
13. Không làm thay đổi behavior hiện có của Dictation/Shadowing.

## Phase 0 - Đọc và xác nhận hiện trạng

### Việc cần làm

1. Đọc các file backend:
   - `server/src/config/env.js`
   - `server/src/routes/index.js`
   - `server/src/modules/videos/video.model.js`
   - `server/src/modules/videos/video.routes.js`
   - `server/src/modules/videos/video.controller.js`
   - `server/src/modules/videos/video.service.js`
   - `server/src/modules/videos/video.validation.js`
   - `server/src/modules/transcripts/transcriptSegment.model.js`
   - `server/src/modules/transcripts/transcript.routes.js`
   - `server/src/modules/transcripts/transcript.controller.js`
   - `server/src/modules/transcripts/transcript.service.js`
   - `server/src/modules/transcripts/transcript.validation.js`
   - `server/src/modules/youtube/youtube.service.js`
   - `server/src/modules/media/openaiTts.service.js`

2. Đọc các file frontend:
   - `client/src/app/router.jsx`
   - `client/src/features/videos/pages/VideoLibraryPage.jsx`
   - `client/src/features/videos/pages/VideoLearningPage.jsx`
   - `client/src/features/videos/components/SegmentYoutubePlayer.jsx`
   - `client/src/features/videos/services/videoApi.js`
   - `client/src/features/videos/hooks/useVideoLearning.js`
   - `client/src/components/ui/*`

### Kết quả mong muốn

- Agent hiểu `VideoLesson` và `TranscriptSegment` là 2 model chính cần mở rộng.
- Agent hiểu `SegmentYoutubePlayer` đang dùng chung cho Dictation/Shadowing nên phải sửa tương thích ngược.
- Agent không động vào các module cũ như `courses`, `grammar`, `vocabulary`, `exercises` trừ khi thật sự cần.

## Phase 1 - Cập nhật cấu hình môi trường

### Backend

1. Cập nhật `.env.example` và `server/.env.example` nếu file tồn tại:

```env
OPENAI_TRANSLATION_MODEL=gpt-5.4-nano-2026-03-17
OPENAI_TRANSLATION_TARGET_LANGUAGE=vi
```

2. Cập nhật `server/src/config/env.js`:

```js
openAi: {
  apiKey: process.env.OPENAI_API_KEY || "",
  ttsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  ttsVoice: process.env.OPENAI_TTS_VOICE || "alloy",
  translationModel: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.4-nano-2026-03-17",
  translationTargetLanguage: process.env.OPENAI_TRANSLATION_TARGET_LANGUAGE || "vi",
}
```

### Checkpoint

- Server vẫn import được `config`.
- Không bắt buộc `OPENAI_API_KEY` ở boot time, vì app vẫn phải chạy được khi chưa cấu hình OpenAI.

## Phase 2 - Cập nhật database models

### 2.1 Cập nhật `VideoLesson`

File: `server/src/modules/videos/video.model.js`

Thêm fields:

```js
contentType: {
  type: String,
  enum: ["lesson", "music", "movie", "other"],
  default: "lesson",
},
bilingualStatus: {
  type: String,
  enum: ["none", "pending", "processing", "completed", "failed"],
  default: "none",
},
bilingualSourceLanguage: { type: String, default: "en" },
bilingualTargetLanguage: { type: String, default: "vi" },
bilingualModel: { type: String, default: "" },
bilingualError: { type: String, default: "" },
bilingualGeneratedAt: { type: Date },
```

Thêm index nếu cần:

```js
videoLessonSchema.index({ contentType: 1, isPublished: 1 });
videoLessonSchema.index({ bilingualStatus: 1 });
```

### 2.2 Cập nhật `TranscriptSegment`

File: `server/src/modules/transcripts/transcriptSegment.model.js`

Thêm fields:

```js
translationText: { type: String, default: "", trim: true },
translationLanguage: { type: String, default: "vi" },
translationStatus: {
  type: String,
  enum: ["none", "translated", "edited", "failed"],
  default: "none",
},
translationError: { type: String, default: "" },
translatedAt: { type: Date },
```

Thêm index:

```js
transcriptSegmentSchema.index({ videoId: 1, translationStatus: 1 });
```

### Checkpoint

- Model compile không lỗi.
- Các document cũ không cần migration bắt buộc vì field mới có default.

## Phase 3 - Mở rộng transcript update để sửa Vietsub

### 3.1 Validation

File: `server/src/modules/transcripts/transcript.validation.js`

Mở rộng `updateSegmentSchema.body`:

```js
translationText: z.string().trim().optional(),
translationLanguage: z.string().trim().min(2).max(12).optional(),
```

Giữ rule:

- Body phải có ít nhất 1 field.
- `startTime/endTime` vẫn validate như hiện tại.

### 3.2 Service

File: `server/src/modules/transcripts/transcript.service.js`

Trong `updateSegment(segmentId, data)`:

1. Nếu `data.translationText !== undefined`:
   - `segment.translationText = data.translationText`
   - `segment.translationLanguage = data.translationLanguage || segment.translationLanguage || "vi"`
   - Nếu text sau trim có nội dung:
     - `segment.translationStatus = "edited"`
     - `segment.translatedAt = new Date()`
   - Nếu text rỗng:
     - `segment.translationStatus = "none"`
     - `segment.translatedAt = undefined` hoặc giữ nguyên nếu muốn audit nhẹ
   - `segment.translationError = ""`

2. Không để việc sửa bản dịch làm thay đổi `segment.source` tiếng Anh.

3. Nếu sửa `text` tiếng Anh, giữ behavior hiện tại:
   - update `normalizedText`
   - update `wordCount`
   - set `source = "edited"`

### Checkpoint

- Admin có thể gọi `PATCH /api/transcripts/:segmentId` để sửa `translationText`.
- Dictation/Shadowing không bị ảnh hưởng vì vẫn dùng `segment.text`.

## Phase 4 - Tạo backend module `bilingual`

Tạo folder:

```txt
server/src/modules/bilingual/
├── bilingual.routes.js
├── bilingual.controller.js
├── bilingual.service.js
├── bilingual.validation.js
└── openaiTranslation.service.js
```

## Phase 5 - Implement OpenAI translation service

File: `server/src/modules/bilingual/openaiTranslation.service.js`

### Yêu cầu

1. Import:
   - `OpenAI` từ package `openai`.
   - `config` từ `../../config/env.js`.
   - `createHttpError` từ `../../utils/createHttpError.js`.

2. Nếu thiếu `config.openAi.apiKey`, throw:

```txt
OPENAI_API_KEY is not configured
```

3. Model phải đọc từ:

```js
config.openAi.translationModel
```

4. Batch size mặc định: 30-50 segments/request.

5. Output parse thành format:

```js
{
  translations: [
    { id, index, translationText }
  ]
}
```

6. Mapping kết quả theo `id`, không chỉ dựa vào thứ tự.

### Prompt

System prompt:

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

### Lưu ý implementation

- Ưu tiên dùng JSON response format nếu SDK hiện tại hỗ trợ.
- Nếu không dùng được JSON schema, lấy text response rồi `JSON.parse`.
- Nếu parse lỗi, throw lỗi rõ ràng để service gọi phía trên set `video.bilingualStatus = "failed"`.
- Không update `segment.text` từ output OpenAI.

## Phase 6 - Implement `bilingual.service.js`

File: `server/src/modules/bilingual/bilingual.service.js`

### 6.1 Hàm `getBilingualVideo(videoId, options)`

Input:

```js
{
  admin: Boolean
}
```

Logic:

1. Tìm `VideoLesson` theo `_id`.
2. Nếu không phải admin, thêm điều kiện `isPublished: true`.
3. Nếu không thấy video, throw 404.
4. Tìm `TranscriptSegment` theo `videoId`.
5. Nếu không phải admin, thêm điều kiện `isPublished: true`.
6. Sort `{ index: 1 }`.
7. Với public user:
   - Chỉ trả `translationText` nếu `translationStatus` là `translated` hoặc `edited`.
   - Nếu status khác, trả `translationText: ""`.
8. Return `{ video, segments }`.

### 6.2 Hàm `generateVietsub(videoId, options)`

Input:

```js
{
  force,
  targetLanguage
}
```

Logic:

1. Tìm video bằng `_id`.
2. Nếu không thấy, throw 404.
3. Nếu `video.transcriptStatus !== "completed"`, throw 400:

```txt
Cannot generate Vietnamese subtitles before transcript is completed
```

4. Build filter segment:
   - Luôn `{ videoId: video._id, isPublished: true }`.
   - Nếu `force = false`, thêm điều kiện chỉ lấy segment chưa dịch hoặc dịch lỗi.
5. Nếu không có segment cần dịch, throw 400:

```txt
No transcript segments need translation
```

6. Set video:
   - `bilingualStatus = "processing"`
   - `bilingualError = ""`
   - `bilingualModel = config.openAi.translationModel`
   - `bilingualTargetLanguage = targetLanguage || config.openAi.translationTargetLanguage`
7. Gọi `translateSegmentsInBatches`.
8. Update từng segment:
   - Thành công:
     - `translationText`
     - `translationLanguage`
     - `translationStatus = "translated"`
     - `translationError = ""`
     - `translatedAt = new Date()`
   - Thất bại:
     - `translationStatus = "failed"`
     - `translationError`
9. Set video:
   - Nếu `translatedCount > 0`: `bilingualStatus = "completed"`
   - Nếu `translatedCount === 0`: `bilingualStatus = "failed"`
   - `bilingualGeneratedAt = new Date()`
   - `bilingualError = ""` nếu thành công, ngược lại lưu lỗi.
10. Return `{ video, translatedCount, failedCount, segments }`.

### Checkpoint

- Logic dịch nằm trong service, không nằm trong controller.
- Nếu OpenAI lỗi, video phải được set `bilingualStatus = "failed"`.
- Không xóa transcript segment.

## Phase 7 - Implement validation/controller/routes

### 7.1 Validation

File: `server/src/modules/bilingual/bilingual.validation.js`

Tạo:

```js
export const bilingualVideoParamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
});

export const generateVietsubSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex, "Invalid video id") }),
  body: z.object({
    force: z.preprocess(optionalBoolean, z.boolean().optional()),
    targetLanguage: z.string().trim().min(2).max(12).optional(),
  }).strict(),
});
```

### 7.2 Controller

File: `server/src/modules/bilingual/bilingual.controller.js`

Tạo controller:

- `getBilingualVideoController`
- `generateVietsubController`

Response dùng `successResponse`.
Async wrapper dùng `asyncHandler`.
Admin check:

```js
const isAdmin = req.user?.role === "admin";
```

### 7.3 Routes

Có 2 cách. Ưu tiên cách A để URL đúng tài liệu.

#### Cách A - gắn vào `videos.routes.js`

Thêm routes:

```js
router.get("/:id/bilingual", optionalAuth, validate(bilingualVideoParamSchema), getBilingualVideoController);
router.post(
  "/:id/generate-vietsub",
  requireAuth,
  requireRole("admin"),
  validate(generateVietsubSchema),
  generateVietsubController,
);
```

Khi dùng cách A, vẫn giữ service/controller trong module `bilingual`, chỉ import controller/validation vào `videos.routes.js`.

#### Cách B - route riêng `/api/bilingual`

Chỉ dùng nếu muốn tách route:

```http
GET /api/bilingual/videos/:id
POST /api/bilingual/videos/:id/generate-vietsub
```

Nếu dùng cách B thì frontend API phải khớp lại. Không dùng song song cả hai cách.

### Checkpoint

- `GET /api/videos/:id/bilingual` hoạt động cho public video.
- `POST /api/videos/:id/generate-vietsub` yêu cầu admin token.
- Guest gọi POST phải 401/403.

## Phase 8 - Cảnh báo khi phân tích lại transcript đã có Vietsub

### Backend

Không bắt buộc chặn ở backend trong MVP, nhưng nên an toàn:

- Trong `analyzeVideoTranscript(id)`, nếu `video.bilingualStatus === "completed"` và request không có flag force/reset, cân nhắc throw 409.
- Nếu không sửa backend, frontend phải confirm rõ vì `createTranscriptSegments` hiện xóa toàn bộ segment cũ.

### Frontend

Khi admin bấm `Phân tích transcript` trên video đã có `bilingualStatus = "completed"`:

- Hiện confirm:

```txt
Phân tích lại transcript sẽ xóa Vietsub hiện có. Bạn có muốn tiếp tục?
```

### Checkpoint

- Agent không được bỏ qua rủi ro mất bản dịch khi re-analyze transcript.

## Phase 9 - Frontend API và hooks

### 9.1 API client

Tạo file:

```txt
client/src/features/bilingual/services/bilingualApi.js
```

Nội dung:

```js
import { apiClient } from "../../../services/apiClient.js";

export function getBilingualVideo(id) {
  return apiClient.get(`/videos/${id}/bilingual`);
}

export function generateVietsub(id, data) {
  return apiClient.post(`/videos/${id}/generate-vietsub`, data);
}
```

### 9.2 Hooks

Tạo file:

```txt
client/src/features/bilingual/hooks/useBilingualWatch.js
```

Tạo hooks:

- `useBilingualVideo(id)`
- `useGenerateVietsub(id)`
- Có thể import `updateTranscriptSegment` từ `features/videos/services/videoApi.js` hoặc tạo wrapper riêng.

Query keys:

```js
["bilingual-video", id]
```

Khi tạo Vietsub thành công, invalidate:

```js
queryClient.invalidateQueries({ queryKey: ["bilingual-video", id] });
queryClient.invalidateQueries({ queryKey: ["video", id] });
queryClient.invalidateQueries({ queryKey: ["video-transcripts", id] });
queryClient.invalidateQueries({ queryKey: ["videos"] });
```

### Checkpoint

- Hooks không gọi API nếu thiếu `id`.
- Mutation có loading/error state để UI dùng.

## Phase 10 - Mở rộng `SegmentYoutubePlayer`

File: `client/src/features/videos/components/SegmentYoutubePlayer.jsx`

### Props mới

```js
continuous = false
onTimeChange
```

### Ref methods cần có

Giữ methods cũ:

- `pauseVideo`
- `playFrom`
- `playSegment`

Có thể thêm:

- `seekTo(time)`
- `playVideo()`
- `getCurrentTime()`

### Behavior bắt buộc

1. Khi `continuous = false`, `playSegment()` vẫn dừng tại `endTime` như hiện tại.
2. Khi `continuous = true`, player phát liên tục và không dùng boundary timer segment.
3. Khi player PLAYING, tạo interval 250ms để gọi:

```js
onTimeChange?.(Number(player.getCurrentTime?.() || 0));
```

4. Khi PAUSED/ENDED/destroy, clear interval.
5. Không tạo memory leak với interval.

### Checkpoint regression

- Dictation page vẫn play từng segment rồi dừng.
- Shadowing page vẫn play từng segment rồi dừng.
- Bilingual page nhận được current time đều đặn khi video phát.

## Phase 11 - Tạo giao diện `BilingualWatchPage`

Tạo file:

```txt
client/src/features/bilingual/pages/BilingualWatchPage.jsx
```

### State cần có

- `currentTime`
- `activeIndex`
- `editingSegmentId`
- `isPlayerPlaying`
- `isYoutubeReady`

### Dữ liệu

Dùng `useBilingualVideo(id)` để lấy:

- `video`
- `segments`

### Active segment

Tính bằng:

```js
const activeIndex = segments.findIndex((segment) => {
  return currentTime >= Number(segment.startTime) && currentTime < Number(segment.endTime);
});
```

Nếu không match:

- Giữ active hiện tại nếu current time nằm sau segment cuối.
- Hoặc set `-1`.

### Layout desktop

```txt
section bg-cream-soft
└── div max width grid
    ├── left: player + toolbar
    └── right: subtitle list
```

Yêu cầu:

- Desktop `xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)]`.
- Player bên trái lớn, dùng `SegmentYoutubePlayer continuous`.
- Subtitle bên phải scroll riêng.
- Không bọc page section trong card lớn không cần thiết.

### Layout mobile

Yêu cầu:

- Player nằm trên.
- Subtitle list nằm dưới.
- Player có thể sticky top nếu không gây lỗi overlap.
- Không để text phụ đề chồng lên badge thời gian.

### Checkpoint

- Guest xem được video published.
- Nếu chưa có Vietsub, vẫn xem được English subtitle.
- Nếu video không tồn tại hoặc unpublished với guest, hiển thị lỗi gọn.

## Phase 12 - Tạo `BilingualSubtitleList`

Tạo file:

```txt
client/src/features/bilingual/components/BilingualSubtitleList.jsx
```

### Props

```js
{
  activeIndex,
  editingSegmentId,
  isAdmin,
  onEdit,
  onSeek,
  onUpdateSegment,
  segments,
}
```

### UI mỗi item

Hiển thị:

- English text.
- Vietnamese text nếu có.
- Nếu chưa có bản dịch: text muted `Chưa có Vietsub`.
- Badge thời gian định dạng `mm:ss`.
- Admin edit icon dùng `Button` size icon và `Pencil` từ `lucide-react`.

### Behavior

1. Click item gọi:

```js
onSeek(segment);
```

2. Active item:
   - background `cream-soft`
   - border hoặc ring `coral`

3. Auto-scroll active segment vào view:
   - Dùng ref map theo segment id.
   - Khi `activeIndex` thay đổi, gọi `scrollIntoView({ block: "nearest" })`.

### Admin edit

Có thể dùng `Dialog` hoặc inline form.

Form fields:

- `Textarea` tiếng Anh.
- `Textarea` tiếng Việt.
- `Input` startTime.
- `Input` endTime.
- Save/Cancel bằng `Button`.

Save gọi `PATCH /api/transcripts/:segmentId`.

### Checkpoint

- List scroll mượt.
- Click subtitle seek đúng thời điểm.
- Admin sửa bản dịch xong UI cập nhật.

## Phase 13 - Tạo `BilingualAdminToolbar`

Tạo file:

```txt
client/src/features/bilingual/components/BilingualAdminToolbar.jsx
```

### Props

```js
{
  analyzeMutation,
  generateMutation,
  onAnalyzeTranscript,
  onGenerateVietsub,
  segmentsCount,
  video,
}
```

### UI

Chỉ render nếu:

```js
user?.role === "admin"
```

Hiển thị:

- Badge `Transcript: ${video.transcriptStatus}`
- Badge `Vietsub: ${video.bilingualStatus || "none"}`
- Button `Phân tích transcript`
- Button `Tạo Vietsub` hoặc `Tạo lại Vietsub`
- Alert nếu có `video.transcriptError` hoặc `video.bilingualError`

Disable `Tạo Vietsub` khi:

- `video.transcriptStatus !== "completed"`
- `segmentsCount < 1`
- `generateMutation.isPending`

### Checkpoint

- Guest không thấy toolbar.
- Admin thấy đúng trạng thái.
- Loading state rõ ràng.

## Phase 14 - Thêm route frontend

File: `client/src/app/router.jsx`

Thêm:

```js
import BilingualWatchPage from "../features/bilingual/pages/BilingualWatchPage.jsx";
```

Trong children:

```js
{ path: "videos/:id/bilingual", element: <BilingualWatchPage /> },
```

### Checkpoint

- Truy cập trực tiếp `/videos/:id/bilingual` hoạt động.
- Route cũ `/videos/:id?mode=dictation` và `/videos/:id?mode=shadowing` vẫn hoạt động.

## Phase 15 - Thêm mode vào thư viện video

File: `client/src/features/videos/pages/VideoLibraryPage.jsx`

### Cập nhật dialog chọn mode

Thêm card thứ ba:

- Icon: `Languages` hoặc `Clapperboard`.
- Title: `Video song ngữ`.
- Mode: `bilingual`.

### Cập nhật `startLearning(mode)`

```js
function startLearning(mode) {
  if (!modePickerVideo?._id) return;
  setModePickerVideo(null);

  if (mode === "bilingual") {
    navigate(`/videos/${modePickerVideo._id}/bilingual`);
    return;
  }

  navigate(`/videos/${modePickerVideo._id}?mode=${mode}`);
}
```

### Checkpoint

- Click video trong library hiện 3 lựa chọn.
- Chọn `Video song ngữ` đi đúng route.

## Phase 16 - Kiểm thử thủ công backend

Chạy từ `server`:

```bash
npm run start
```

Hoặc dev:

```bash
npm run dev
```

Test checklist:

1. Login admin lấy token.
2. Tạo video YouTube bằng API hiện có hoặc UI hiện có.
3. Đảm bảo video có transcript.
4. Gọi:

```http
POST /api/videos/:id/generate-vietsub
Authorization: Bearer <admin-token>
```

5. Kiểm tra response có:
   - `translatedCount`
   - `failedCount`
   - `video.bilingualStatus`
6. Gọi:

```http
GET /api/videos/:id/bilingual
```

7. Kiểm tra segment có:
   - `text`
   - `translationText`
   - `translationStatus`

## Phase 17 - Kiểm thử thủ công frontend

Chạy từ `client`:

```bash
npm run build
```

Nếu cần dev server:

```bash
npm run dev
```

Test desktop 1440px:

1. Mở thư viện.
2. Chọn video.
3. Chọn `Video song ngữ`.
4. Kiểm tra:
   - Player bên trái.
   - Subtitle bên phải.
   - Subtitle panel scroll riêng.
   - Active segment highlight theo thời gian video.
   - Click subtitle seek đúng.

Test mobile 360px:

1. Player nằm trên.
2. Subtitle nằm dưới.
3. Không overlap text/badge/button.
4. Scroll ổn.

Test admin:

1. Login admin.
2. Mở page song ngữ.
3. Thấy toolbar.
4. Bấm `Tạo Vietsub`.
5. Sửa một subtitle tiếng Việt.
6. Reload page, bản dịch vẫn còn.

## Phase 18 - Regression bắt buộc

Kiểm tra lại:

1. Dictation:
   - Vào mode dictation.
   - Bấm phát segment.
   - Video dừng tại `endTime`.
   - Submit đáp án vẫn hoạt động.

2. Shadowing:
   - Vào mode shadowing.
   - Bấm phát segment.
   - Video dừng tại `endTime`.
   - Ghi âm và submit assessment vẫn hoạt động.

3. Library:
   - Add video vẫn hoạt động.
   - Publish/unpublish vẫn hoạt động.
   - Delete video vẫn hoạt động.

4. Security:
   - Guest không gọi được `POST /generate-vietsub`.
   - Guest không thấy unpublished video.
   - Admin thấy unpublished video nếu include/token phù hợp.

## Definition of Done

Tính năng chỉ xem là hoàn thành khi:

1. Backend có field song ngữ trong `VideoLesson` và `TranscriptSegment`.
2. Backend gọi OpenAI bằng model từ env `OPENAI_TRANSLATION_MODEL`.
3. Admin tạo Vietsub được từ transcript có sẵn.
4. Public user xem được player + subtitle song ngữ.
5. Subtitle active đồng bộ theo YouTube current time.
6. Admin sửa được bản dịch từng segment.
7. Desktop/mobile khớp tinh thần ảnh tham chiếu.
8. Dictation/Shadowing không regression.
9. `npm run build` trong client pass.
10. Server chạy không lỗi import/runtime cơ bản.
