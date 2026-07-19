# Mô tả tính năng xem phim song ngữ

## 1. Thông tin tài liệu

| Thuộc tính | Nội dung |
| --- | --- |
| Tên tính năng | Thư viện phim và trình xem phim song ngữ |
| Sản phẩm | Ứng dụng học tiếng Anh qua Shadowing, Dictation và nội dung song ngữ |
| Nền tảng | Web responsive |
| Nguồn video | Bunny Stream |
| Người dùng | Khách truy cập không cần đăng nhập và Admin |
| Phong cách giao diện | Trải nghiệm duyệt phim kiểu Netflix, tuân thủ token và component của `DESIGN.MD` |
| Phiên bản | MVP |
| Trạng thái | Sẵn sàng refinement kỹ thuật |

## 2. Bối cảnh và vấn đề

Hệ thống hiện hỗ trợ bài học từ YouTube và đã có dữ liệu phụ đề tiếng Anh (`text`) cùng bản dịch tiếng Việt (`translationText`). Tuy nhiên, phim do Admin sở hữu chưa có quy trình lưu trữ, encode, phát adaptive streaming và quản lý trạng thái hoàn chỉnh.

Tính năng mới dùng Bunny Stream để:

- Lưu file phim và encode thành định dạng phù hợp nhiều thiết bị/băng thông.
- Stream ổn định mà không truyền file video qua server ứng dụng khi người dùng xem.
- Cho phép Admin upload file lớn có thể tạm dừng/tiếp tục.
- Đồng bộ lớp phụ đề song ngữ của ứng dụng với thời gian phát video.
- Tạo trải nghiệm khám phá phim theo category, trình bày dạng hero và carousel.

## 3. Mục tiêu sản phẩm

### 3.1 Mục tiêu chính

- Người dùng vào web có thể tìm và xem phim đã phát hành mà không cần tài khoản.
- Người dùng có thể xem tiếng Anh, tiếng Việt hoặc đồng thời hai ngôn ngữ.
- Người học có thể bấm một câu phụ đề để tua đến đúng đoạn phim.
- Admin quản lý phim, category và phụ đề ngay trong giao diện public bằng inline controls.
- File video được upload trực tiếp từ trình duyệt Admin lên Bunny Stream, không đi qua Express server.

### 3.2 Chỉ số thành công MVP

- Tỷ lệ upload thành công với file hợp lệ từ 95% trở lên.
- 100% phim public phải ở trạng thái Bunny `ready`, có ít nhất một segment tiếng Anh và thuộc category public.
- Thời gian bắt đầu phát p75 dưới 4 giây trên kết nối băng rộng thông thường.
- Sai lệch hiển thị phụ đề mục tiêu không quá 300 ms sau thao tác play/seek.
- Không có category rỗng xuất hiện với người dùng public.
- Không lộ Bunny Stream API key hoặc token security key ở frontend.

## 4. Phạm vi MVP

### 4.1 Trong phạm vi

- Trang thư viện phim tại `/movies`.
- Trang xem phim tại `/movies/:id`.
- Hero phim nổi bật và các hàng phim theo category.
- Tìm kiếm phim theo tiêu đề/mô tả.
- Admin tạo, sửa, sắp xếp, publish/unpublish category bằng inline controls.
- Admin tạo phim và upload MP4/MOV/WebM lên Bunny bằng TUS resumable upload.
- Theo dõi các trạng thái upload và encode.
- Nhận Bunny webhook để cập nhật trạng thái xử lý.
- Import phụ đề tiếng Anh từ `.srt` hoặc `.vtt`.
- Import phụ đề tiếng Việt hoặc tạo Vietsub bằng luồng dịch hiện có.
- Chỉnh sửa từng segment, thời gian bắt đầu/kết thúc và bản dịch.
- Ba chế độ phụ đề: `Song ngữ`, `English`, `Tiếng Việt`.
- Bật/tắt phụ đề, điều chỉnh kích thước chữ, bấm câu để seek.
- Public chỉ thấy category có ít nhất một phim đủ điều kiện hiển thị.
- Admin thấy mọi category, kể cả category rỗng và chưa publish.
- Responsive cho desktop, tablet và mobile.

### 4.2 Ngoài phạm vi MVP

- Tài khoản học viên, hồ sơ cá nhân và đồng bộ lịch sử xem đa thiết bị.
- Thanh toán, subscription hoặc giới hạn nội dung theo gói.
- DRM cấp doanh nghiệp.
- Upload nhiều phim đồng thời.
- Series, season, episode.
- Nhiều audio track/dubbing.
- Bình luận, đánh giá và danh sách yêu thích đồng bộ server.
- Admin dashboard riêng.
- Tự động nhận dạng lời nói từ audio phim nếu không có subtitle.

## 5. Đối tượng sử dụng

### 5.1 Khách truy cập

- Không cần đăng nhập.
- Xem category và phim đã publish.
- Xem phim, chuyển chế độ phụ đề và thao tác với danh sách câu thoại.
- Không thấy nội dung draft, phim đang encode, category rỗng hoặc control quản trị.

### 5.2 Admin

- Đăng nhập bằng cơ chế Admin hiện tại.
- Dùng cùng giao diện với khách truy cập nhưng có thêm inline controls.
- Thấy category rỗng, category draft, phim draft và trạng thái xử lý.
- Upload video, import subtitle, sửa metadata, kiểm tra preview và publish.

## 6. Trải nghiệm người dùng

### 6.1 Trang thư viện phim

Trang `/movies` có bố cục điện ảnh tối, ưu tiên nội dung thay vì giao diện marketing:

- Header gọn với logo, điều hướng học tập, tìm kiếm và nút đăng nhập/đăng xuất Admin.
- Hero toàn chiều ngang dùng backdrop của một phim nổi bật đã publish.
- Hero hiển thị tên phim, mô tả ngắn, level, thời lượng và nút `Xem phim`.
- Bên dưới là các hàng ngang theo category, có nút điều hướng bằng icon.
- Poster giữ tỷ lệ ổn định `2:3`; backdrop dùng `16:9`.
- Hover desktop hiển thị metadata và hành động; mobile dùng tap, không phụ thuộc hover.
- Không dùng card lồng card hoặc các section nổi dạng card.

### 6.2 Quy tắc category

Một phim được tính là `public playable` khi đồng thời thỏa mãn:

- `isPublished = true`.
- `contentType = movie`.
- `source = bunny`.
- `streamStatus = ready`.
- Có ít nhất một transcript segment tiếng Anh được publish.
- Category chứa phim cũng đang publish.

Quy tắc hiển thị:

| Trường hợp | Public | Admin |
| --- | --- | --- |
| Category publish, có phim public playable | Hiển thị | Hiển thị |
| Category publish nhưng không có phim public playable | Ẩn | Hiển thị kèm `0 phim public` |
| Category chưa publish | Ẩn | Hiển thị nhãn `Draft` |
| Category chỉ có phim draft/processing/failed | Ẩn | Hiển thị kèm số lượng và trạng thái |
| Category hệ thống `all-videos` | Không hiển thị thành hàng | Không hiển thị thành category nội dung |

Backend là nguồn quyết định quyền nhìn thấy. Frontend vẫn lọc category rỗng như lớp phòng vệ để tránh section trắng khi dữ liệu thay đổi giữa hai request.

### 6.3 Trang xem phim

- Video chiếm vùng chính, nền đen, không bị đặt trong decorative card.
- Bunny iframe player được điều khiển qua Playback Control API (`player.js`).
- Phụ đề của ứng dụng nằm trên video, gồm tiếng Anh và tiếng Việt theo mode đã chọn.
- Panel transcript bên dưới hoặc bên phải tùy viewport.
- Segment đang phát được highlight và tự cuộn có kiểm soát.
- Bấm segment gọi `seek(startTime)` và tiếp tục phát theo trạng thái trước đó.
- Người dùng có thể đổi mode mà không reload video.
- Khi fullscreen không thể đảm bảo overlay tùy biến nằm trên iframe, MVP dùng caption/controls hỗ trợ của player hoặc thông báo mode fullscreen phù hợp; cần spike kỹ thuật trước khi khóa UX fullscreen.

## 7. Yêu cầu chức năng

### FR-01: Lấy thư viện phim public

- API trả về các category public có ít nhất một phim public playable.
- Mỗi category chứa danh sách phim đã sắp xếp.
- Không trả URL có token tồn tại lâu hoặc bất kỳ secret nào.

### FR-02: Lấy thư viện cho Admin

- Admin có thể yêu cầu bao gồm category/phim chưa publish.
- Kết quả có `publicVideoCount`, `totalVideoCount` và thống kê trạng thái.
- Category rỗng vẫn có mặt trong response.

### FR-03: Upload phim lên Bunny

- Admin nhập metadata tối thiểu: title và category.
- Backend tạo bản ghi draft và video object trên Bunny.
- Backend trả thông tin TUS upload có chữ ký hết hạn.
- Frontend upload trực tiếp lên Bunny, hiển thị phần trăm và cho phép resume.
- API key chỉ tồn tại trong biến môi trường backend.

### FR-04: Đồng bộ trạng thái encode

- Backend nhận webhook đã xác thực chữ ký từ Bunny.
- Map trạng thái Bunny sang `created`, `uploading`, `processing`, `ready`, `failed`.
- Khi `ready`, cập nhật duration, thumbnail và metadata có thể lấy từ Bunny.
- Webhook phải idempotent; callback lặp không tạo side effect sai.

### FR-05: Import phụ đề

- Chấp nhận `.srt` và `.vtt`, UTF-8, tối đa cấu hình theo server.
- Parser hỗ trợ timestamp có millisecond và subtitle nhiều dòng.
- Validate `startTime >= 0`, `endTime > startTime`, text không rỗng.
- Hiển thị preview số segment, lỗi dòng và cảnh báo overlap trước khi lưu.
- Import tiếng Anh ghi vào `text`; import tiếng Việt ghép theo timestamp vào `translationText`.

### FR-06: Dịch và chỉnh sửa Vietsub

- Tái sử dụng luồng `generate-vietsub` hiện tại.
- Admin có thể dịch lại toàn bộ hoặc cập nhật thủ công từng câu.
- Không tự động publish phim sau khi dịch xong.

### FR-07: Publish phim

Chỉ được publish khi:

- Bunny đã `ready`.
- Metadata bắt buộc hợp lệ.
- Category tồn tại và được phép gán.
- Có ít nhất một segment tiếng Anh publish.
- Không có lỗi subtitle validation nghiêm trọng.

Vietsub không bắt buộc về mặt kỹ thuật để preview, nhưng phim được gắn nhãn `Song ngữ` chỉ khi tất cả segment cần thiết có `translationText`.

### FR-08: Phát phim và đồng bộ subtitle

- Backend sinh embed URL/token ngắn hạn nếu Bunny token authentication được bật.
- Frontend không tự ký token.
- Player phát các event `ready`, `timeupdate`, `play`, `pause`, `seeked`, `ended`, `error`.
- Logic tìm active segment dựa trên `startTime <= currentTime < endTime`.
- Seek từ transcript cập nhật player và active segment ngay.

### FR-09: Quản trị inline

- Chỉ render khi `user?.role === "admin"`.
- Các thao tác gồm thêm/sửa/xóa category rỗng, thêm/sửa/xóa phim, publish, import subtitle và preview.
- Xóa category có phim bị chặn như quy tắc hiện tại.
- Xóa phim cần xác nhận và phải định nghĩa rõ việc xóa cả Bunny asset hay chỉ xóa bản ghi.

### FR-10: Trạng thái lỗi

- Upload lỗi có nút thử lại/tiếp tục.
- Encode lỗi có thông báo và action kiểm tra lại trạng thái.
- Subtitle lỗi chỉ rõ dòng/segment.
- Playback lỗi có retry và mã tương quan để tra log.
- Public không nhìn thấy nội dung lỗi hoặc chưa sẵn sàng.

## 8. Mô hình dữ liệu đề xuất

### 8.1 Mở rộng `VideoLesson`

```js
{
  source: "youtube" | "bunny",
  contentType: "lesson" | "music" | "movie" | "other",

  // Chỉ bắt buộc khi source = youtube
  youtubeUrl: String,
  youtubeVideoId: String,

  // Chỉ bắt buộc khi source = bunny
  bunnyVideoId: String,
  bunnyLibraryId: String,
  streamStatus: "created" | "uploading" | "processing" | "ready" | "failed",
  streamError: String,
  streamReadyAt: Date,

  title: String,
  description: String,
  posterUrl: String,
  backdropUrl: String,
  thumbnailUrl: String,
  duration: Number,
  releaseYear: Number,
  level: "A1" | "A2" | "B1" | "B2" | "C1",
  isFeatured: Boolean,
  isPublished: Boolean,
  publishedAt: Date,
  topicId: ObjectId
}
```

Lưu ý:

- MVP giữ `topicId` một category chính để tương thích code hiện tại.
- Không lưu signed playback URL vì URL này có hạn dùng; sinh khi request playback.
- Unique index cho YouTube phải chuyển sang partial index theo `source`.
- Thêm partial unique index cho `bunnyVideoId`.
- `youtubeUrl` và `youtubeVideoId` đổi thành conditional required.

### 8.2 Tái sử dụng `TranscriptSegment`

```js
{
  videoId: ObjectId,
  index: Number,
  startTime: Number,
  endTime: Number,
  duration: Number,
  text: String,
  translationText: String,
  source: "youtube" | "manual" | "imported",
  isPublished: Boolean
}
```

Nên bổ sung metadata import ở cấp video hoặc một `SubtitleImport` audit record nếu cần truy vết file, người import và lỗi. Không lưu nội dung phim/video trong MongoDB.

## 9. API đề xuất

| Method | Endpoint | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/api/movies/library` | Public/optional auth | Trả category và phim theo đúng visibility |
| GET | `/api/movies/:id` | Public/optional auth | Chi tiết phim và transcript được phép xem |
| GET | `/api/movies/:id/playback` | Public/optional auth | Trả embed URL/token ngắn hạn |
| POST | `/api/movies` | Admin | Tạo draft phim và Bunny video object |
| POST | `/api/movies/:id/upload-credentials` | Admin | Cấp thông tin TUS upload có thời hạn |
| GET | `/api/movies/:id/stream-status` | Admin | Đối soát trạng thái với Bunny |
| PATCH | `/api/movies/:id` | Admin | Sửa metadata/category |
| PATCH | `/api/movies/:id/publish` | Admin | Publish/unpublish có validation |
| DELETE | `/api/movies/:id` | Admin | Xóa theo chính sách đã chọn |
| POST | `/api/movies/:id/subtitles/en/import` | Admin | Import English SRT/VTT |
| POST | `/api/movies/:id/subtitles/vi/import` | Admin | Import Vietnamese SRT/VTT |
| POST | `/api/videos/:id/generate-vietsub` | Admin | Tái sử dụng chức năng dịch hiện có |
| POST | `/api/webhooks/bunny/stream` | Bunny | Nhận trạng thái encode có xác thực chữ ký |

Nếu team muốn giảm số module trong MVP, các route movie có thể nằm trong module `videos` và lọc `contentType=movie`; không nên nhân đôi business logic transcript.

## 10. Yêu cầu phi chức năng

### Bảo mật

- Bunny API key, library key và token security key chỉ ở backend environment.
- Xác thực HMAC chữ ký webhook trên raw request body.
- Upload credentials ngắn hạn, ràng buộc đúng library/video ID.
- Rate limit endpoint tạo upload và playback token.
- Validate MIME type, extension và giới hạn dung lượng trước upload.
- Cấu hình allowed referrers/token authentication trên Bunny khi phù hợp.

### Hiệu năng

- Lazy load poster/backdrop và các hàng ngoài viewport.
- Không fetch toàn bộ transcript cho poster cards.
- Cache thư viện public; invalidation khi publish/category thay đổi.
- Dùng binary search hoặc con trỏ segment cho `timeupdate`, không scan toàn bộ danh sách mỗi event.
- Không ghi view count ở mỗi `timeupdate`.

### Khả dụng và tương thích

- Hỗ trợ hai phiên bản gần nhất của Chrome, Safari, Firefox và Edge.
- Player giữ tỷ lệ `16:9`; không layout shift khi load.
- Upload có resume sau mất mạng/refresh trong khả năng của TUS client.
- Có loading, empty, processing, failed và retry state rõ ràng.

### Accessibility

- Điều khiển bằng bàn phím; focus indicator rõ.
- Icon button có accessible label và tooltip khi cần.
- Subtitle có độ tương phản đủ trên nền phim.
- Không chỉ dùng màu để biểu thị draft/failed/ready.

## 11. Giả định và quyết định MVP

- Admin có quyền hợp pháp để lưu và phát nội dung phim.
- Chỉ Admin cần đăng nhập; người học vẫn anonymous.
- MVP dùng Bunny embedded player cùng Playback Control API để giảm chi phí xây player.
- App subtitle là nguồn dữ liệu chính cho trải nghiệm song ngữ; Bunny caption không thay thế `TranscriptSegment`.
- Mỗi phim thuộc một category chính trong MVP.
- Xóa Bunny asset là thao tác không thể khôi phục; mặc định ưu tiên soft delete bản ghi trước, cleanup asset bằng action riêng có xác nhận mạnh.
- Giao diện lấy cảm hứng từ mô hình duyệt nội dung của Netflix, không sao chép logo, font, artwork hoặc trade dress độc quyền.

## 12. Definition of Done cấp tính năng

- Hoàn thành toàn bộ acceptance criteria trong `uc.md`.
- Sequence quan trọng trong `seq.md` được hiện thực và có log/correlation ID.
- Workflow publish trong `workflow.md` không thể bị bỏ qua bằng API trực tiếp.
- Unit test parser SRT/VTT, visibility query, publish guard và webhook mapping.
- Integration test tạo upload, webhook idempotency, playback authorization và import subtitle.
- E2E test public/admin trên desktop và mobile.
- Không có secret trong bundle frontend hoặc log.
- Build/lint/test pass; kiểm tra UI bằng screenshot ở các viewport đã định.
- Có hướng dẫn cấu hình Bunny environment và webhook cho môi trường staging/production.

## 13. Tài liệu Bunny tham chiếu

- [HTTP upload](https://docs.bunny.net/stream/http-api)
- [TUS resumable upload](https://docs.bunny.net/stream/tus-resumable-uploads)
- [Playback Control API](https://docs.bunny.net/stream/playback-api)
- [Webhook và chữ ký](https://docs.bunny.net/stream/webhooks)
- [Embed token authentication](https://docs.bunny.net/stream/token-authentication)
- [Cấu trúc URL phát và thumbnail](https://docs.bunny.net/stream/storage-structure)
