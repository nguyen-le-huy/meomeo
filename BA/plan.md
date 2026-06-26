# Kế hoạch chia nhỏ `VideoLibraryPage.jsx`

## Mục tiêu

Giảm kích thước `client/src/features/videos/pages/VideoLibraryPage.jsx` từ một file lớn đang chứa page orchestration, UI sections/cards, dialogs admin và helper parsing/formatting thành các module nhỏ trong feature `videos`.

Refactor phải giữ nguyên hành vi hiện tại:

- Public vẫn xem được thư viện video không cần đăng nhập.
- Admin controls chỉ hiển thị khi `user?.role === "admin"`.
- Vẫn dùng shadcn/ui cho Button, Card, Dialog, Input, Select, Textarea, Alert, Badge.
- Không đổi API hooks/mutations hiện có trong `useVideoLearning.js`.
- Không đổi route hiện tại: `/videos/:id`, `/videos/:id/bilingual`, `/topics/:slug`.

## Hiện trạng

File hiện tại: `client/src/features/videos/pages/VideoLibraryPage.jsx`

Các nhóm trách nhiệm đang bị gộp:

- Page container: lấy auth, fetch topics/videos, điều hướng, chọn mode học.
- Hero section: headline, mô tả, sticker/card giới thiệu.
- Admin actions bar: mở dialog quản lý topic và thêm video.
- Topic section: render mỗi topic và danh sách lesson card.
- Lesson card: thumbnail, metadata, admin publish/delete/topic select.
- Learning mode dialog: chọn Dictation, Shadowing, Song ngữ.
- Topic manager dialog: CRUD topic inline.
- Add video dialog: form thêm video YouTube và transcript thủ công.
- Helper thuần dữ liệu: `buildTopicSections`, `getTopicId`, `parseManualTranscript`, `parseTimeToSeconds`, `formatNumber`, `formatDuration`.
- Constants: level, limit, sticker URLs.

## Cấu trúc đề xuất

```txt
client/src/features/videos/
├── components/
│   ├── AddVideoDialog.jsx
│   ├── LearningModeDialog.jsx
│   ├── LearningModeCard.jsx
│   ├── LessonCard.jsx
│   ├── TopicManagerDialog.jsx
│   ├── TopicVideoSection.jsx
│   ├── VideoLibraryAdminActions.jsx
│   ├── VideoLibraryEmptyState.jsx
│   ├── VideoLibraryErrorState.jsx
│   └── VideoLibraryHero.jsx
├── constants/
│   └── videoLibrary.constants.js
├── pages/
│   └── VideoLibraryPage.jsx
└── utils/
    ├── videoLibrary.js
    └── manualTranscript.js
```

## Phân tách chi tiết

### 1. Constants

Tạo `client/src/features/videos/constants/videoLibrary.constants.js`

Di chuyển:

- `levels`
- `homeTopicVideoLimit`
- `dictationStickerUrl`
- `shadowingStickerUrl`
- `bilingualStickerUrl`
- `heroCatUrl`
- `practiceCatUrl`
- `modeConfig`

Lý do: giảm noise ở page, tái sử dụng được cho dialogs/components.

### 2. Utils thuần dữ liệu

Tạo `client/src/features/videos/utils/videoLibrary.js`

Di chuyển:

- `buildTopicSections`
- `getTopicId`
- `formatNumber`
- `formatDuration`

Tạo `client/src/features/videos/utils/manualTranscript.js`

Di chuyển:

- `parseManualTranscript`
- `parseTimeToSeconds`

Export các helper đang có test hoặc có khả năng cần test riêng. `parseTimeToSeconds` có thể export nếu muốn test trực tiếp, hoặc giữ private trong `manualTranscript.js`.

### 3. Hero và trạng thái page

Tạo:

- `VideoLibraryHero.jsx`
- `VideoLibraryEmptyState.jsx`
- `VideoLibraryErrorState.jsx`

`VideoLibraryHero` nhận props tối thiểu hoặc không nhận props, dùng constants sticker.

`VideoLibraryErrorState` nhận:

- `error`
- `onRetry`

`VideoLibraryEmptyState` không cần props trong MVP hiện tại.

### 4. Topic/video listing

Tạo `TopicVideoSection.jsx`

Di chuyển nguyên component `TopicVideoSection`, import `LessonCard`.

Tạo `LessonCard.jsx`

Di chuyển component `LessonCard`, import:

- `Trash2`, `Headphones`
- shadcn `Badge`, `Button`, `Card`, `CardContent`, `Select*`
- `cn`
- `getTopicId`, `formatNumber`, `formatDuration`

Giữ nguyên behavior:

- Card click mở dialog chọn mode.
- `Enter` và `Space` cũng chọn video.
- Admin select topic không trigger card click nhờ `stopPropagation`.
- Publish/unpublish và delete vẫn dùng mutations từ page truyền xuống.

### 5. Learning mode dialog

Tạo:

- `LearningModeDialog.jsx`
- `LearningModeCard.jsx`

`LearningModeDialog` nhận:

- `open`
- `onOpenChange`
- `onSelectMode`

Import `modeConfig` từ constants.

### 6. Admin actions

Tạo `VideoLibraryAdminActions.jsx`

Component nhận:

- `createTopicMutation`
- `deleteTopicMutation`
- `topics`
- `updateTopicMutation`
- `createVideoMutation`
- `onVideoCreated`

Render:

- `TopicManagerDialog`
- `AddVideoDialog`

Page chỉ còn kiểm tra `isAdmin` và truyền props.

### 7. Topic manager dialog

Tạo `TopicManagerDialog.jsx`

Di chuyển nguyên state/form hiện tại:

- `isOpen`
- `editingTopic`
- `form`
- `resetForm`
- `editTopic`
- `submitTopic`
- `activeError`

Không đổi copy, confirm message, mutation usage.

Sau khi tách, cân nhắc bước sau mới migrate form sang React Hook Form + Zod nếu cần. Không làm cùng refactor này để tránh đổi hành vi.

### 8. Add video dialog

Tạo `AddVideoDialog.jsx`

Di chuyển state/form hiện tại:

- `isOpen`
- `transcriptText`
- `transcriptError`
- `videoForm`
- `handleCreateVideo`

Import:

- `levels` từ constants
- `parseManualTranscript` từ `utils/manualTranscript.js`

Giữ nguyên logic:

- Nếu transcript thủ công lỗi thì không gọi mutation.
- `topicId === "__none__"` gửi `undefined`.
- Nếu title/description rỗng thì gửi `undefined`.
- Sau khi tạo video thành công, reset form, đóng dialog, gọi `onVideoCreated(video)`.

## Page sau refactor

`VideoLibraryPage.jsx` chỉ nên còn:

- imports hooks/router/store
- gọi `useVideos`, `useTopics`, mutations
- tính `visibleTopics`, `topicSections`
- state `modePickerVideo`
- function `startLearning`
- render layout chính, hero, toolbar, loading/error/empty state, topic sections, learning mode dialog

Mục tiêu kích thước page sau refactor: khoảng 120-180 dòng.

## Thứ tự thực hiện

1. Tách constants và utils trước.
2. Tách `LearningModeDialog` vì ít phụ thuộc và dễ kiểm tra.
3. Tách `LessonCard`, sau đó `TopicVideoSection`.
4. Tách `VideoLibraryHero`, `VideoLibraryErrorState`, `VideoLibraryEmptyState`.
5. Tách `TopicManagerDialog` và `AddVideoDialog`.
6. Tạo `VideoLibraryAdminActions`.
7. Dọn imports trong `VideoLibraryPage.jsx`.
8. Chạy lint/build/test hiện có.

## Kiểm tra sau refactor

Chạy tối thiểu:

```bash
npm run build
```

Nếu repo có script riêng cho client thì chạy thêm:

```bash
cd client && npm run build
```

Kiểm tra thủ công trên UI:

- Public user thấy topic/video, không thấy nút Topic hoặc Thêm video.
- Admin thấy nút Topic và Thêm video.
- Click lesson card mở dialog chọn 3 mode.
- Chọn Dictation điều hướng `/videos/:id?mode=dictation`.
- Chọn Shadowing điều hướng `/videos/:id?mode=shadowing`.
- Chọn Song ngữ điều hướng `/videos/:id/bilingual`.
- Admin đổi topic video không mở dialog chọn mode.
- Admin publish/unpublish và delete vẫn gọi đúng mutation.
- Thêm video với transcript thủ công hợp lệ tạo video và điều hướng tới video mới.
- Transcript thủ công sai định dạng hiển thị lỗi và không gọi create mutation.

## Rủi ro cần tránh

- Sai relative import path sau khi chuyển file từ `pages` sang `components`.
- Làm mất `event.stopPropagation()` trong admin controls trên card.
- Đổi giá trị sentinel `"__none__"` khiến select topic bị lỗi.
- Export/import vòng tròn giữa `TopicVideoSection` và `LessonCard`.
- Tách helper nhưng quên export khiến test hoặc import cũ bị hỏng.
- Vô tình hardcode thêm màu mới thay vì giữ shadcn/tailwind pattern hiện tại.

## Không làm trong refactor này

- Không đổi thiết kế UI.
- Không thêm dashboard admin riêng.
- Không thêm student login.
- Không thay đổi API contract backend.
- Không migrate toàn bộ form sang React Hook Form/Zod trong cùng bước tách file.
