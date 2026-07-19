# Kế hoạch triển khai tính năng xem phim song ngữ

## 1. Mục tiêu kế hoạch

Triển khai một vertical slice hoàn chỉnh từ Admin upload phim lên Bunny, nhập phụ đề, preview, publish đến người dùng duyệt category và xem phim song ngữ. Kế hoạch ưu tiên tái sử dụng module `videos`, `topics`, `transcripts`, `bilingual` và cơ chế Admin inline hiện có.

Ước lượng cơ sở: 2 tuần chuẩn bị + 4 sprint, mỗi sprint 2 tuần. Với một full-stack developer duy nhất, dự kiến 9-12 tuần; với 1 backend + 1 frontend + QA bán thời gian, dự kiến 7-9 tuần.

## 2. Nguyên tắc triển khai

- Không tạo Admin dashboard riêng cho MVP.
- Public không cần tài khoản.
- Video upload trực tiếp browser -> Bunny bằng TUS; server không nhận file phim.
- Backend quyết định visibility, publish eligibility và bảo mật token.
- Tái sử dụng `TranscriptSegment.text` và `translationText`.
- Giữ một `topicId` cho mỗi phim trong MVP.
- Chỉ mở public khi Bunny `ready` và subtitle English hợp lệ.
- Mọi thay đổi schema phải tương thích video YouTube đang có.

### 2.1 Gap analysis theo source hiện tại

| Khu vực hiện tại | Có thể tái sử dụng | Khoảng trống cần triển khai |
| --- | --- | --- |
| `server/src/modules/videos/video.model.js` | `contentType=movie`, publish status, topic, metadata chung | `source` mới chỉ có YouTube; YouTube fields đang required; chưa có Bunny ID/lifecycle/partial indexes |
| `server/src/modules/videos/video.service.js` | Public/Admin filtering, create/update/publish structure | Create luôn gọi YouTube analysis; publish guard chưa kiểm tra Bunny ready; chưa có movie library aggregation |
| `server/src/modules/topics/topic.service.js` | CRUD, order, publish và chặn xóa category có phim | Public topic API vẫn có thể trả category rỗng; cần count/filter theo public playable movie |
| `server/src/modules/transcripts/transcriptSegment.model.js` | `text`, `translationText`, timing và publish | Cần server-side SRT/VTT import, dry-run, atomic replace và VI matching report |
| `server/src/modules/bilingual` | Lấy dữ liệu song ngữ và generate Vietsub | Cần dùng được với Bunny movie, không giả định YouTube player |
| `client/src/features/bilingual` | Overlay/list, active segment, admin translate/edit | Player đang là `SegmentYoutubePlayer`; cần player adapter đa nguồn/Bunny |
| `client/src/features/videos/utils/manualTranscript.js` | Parser/paste UX đã hỗ trợ SRT cơ bản ở client | Không đủ làm trust boundary; cần parser/validation tương ứng ở backend |
| `client/src/features/videos/utils/videoLibrary.js` | Đã có defensive filter: public bỏ section rỗng, Admin giữ lại | Cần API policy tương ứng và movie-specific public playable filter |
| Auth/layout/router hiện tại | Optional public auth, Admin role và inline UI | Thêm route/menu `/movies`, không tạo Admin dashboard |

Nguyên tắc migration: mở rộng abstraction video hiện có trước, sau đó tách component movie-specific ở frontend; không fork một bộ transcript/bilingual business logic thứ hai.

## 3. Deliverables

| Mã | Deliverable | Kết quả |
| --- | --- | --- |
| D1 | Product/UX specification | Luồng, wireframe, state và acceptance criteria được duyệt |
| D2 | Bunny integration | Create video, TUS upload, webhook, status sync và secure playback |
| D3 | Movie data/API | Schema đa nguồn, public/admin query, publish guard |
| D4 | Subtitle workflow | Import SRT/VTT, preview lỗi, lưu EN/VI, chỉnh sửa và dịch |
| D5 | Movie library UI | Hero, category carousel, search, empty/admin states |
| D6 | Bilingual watch UI | Player, overlay, transcript panel, seek và subtitle modes |
| D7 | Inline admin UI | Upload, metadata, status, import, preview, publish |
| D8 | Quality/release | Test, logging, security review, staging, rollout và runbook |

## 4. Work Breakdown Structure

### Phase 0 - Discovery và chốt giải pháp (Tuần 1)

#### BA/PM

- Chốt phạm vi MVP và out-of-scope theo `mota.md`.
- Xác nhận bản quyền/permission của nội dung phim.
- Chốt giới hạn file, định dạng, độ phân giải và retention policy.
- Chốt định nghĩa `public playable` và quy tắc category rỗng.
- Chốt chính sách xóa: soft delete, xóa Bunny asset, thời gian khôi phục.
- Chốt KPI baseline và kế hoạch đo.

#### UX/UI

- Information architecture cho `/movies` và `/movies/:id`.
- Wireframe desktop/mobile cho library, upload, processing, player và subtitle panel.
- Chốt hero, poster ratio, carousel behavior, focus/keyboard behavior.
- Chốt cách fullscreen hoạt động với subtitle overlay sau technical spike.
- Mapping token tối theo `DESIGN.MD`, không sao chép tài sản nhận diện Netflix.

#### Technical spike

- Tạo Bunny Stream library staging.
- Upload thử file 2-3 GB bằng `tus-js-client`, ngắt mạng và resume.
- Kiểm tra `player.js`: `ready`, `timeupdate`, `seek`, `pause`, `play`, `error`.
- Kiểm tra overlay subtitle với iframe ở normal/theater/fullscreen.
- Kiểm tra webhook signature bằng raw body trong Express.
- Kiểm tra token authentication và allowed referrer.

#### Exit criteria

- Architecture Decision Record được duyệt.
- Demo spike upload, webhook và subtitle sync chạy được.
- Không còn blocker về fullscreen/player API.

### Phase 1 - Nền tảng backend và schema (Tuần 2-3)

#### BE-01: Environment và Bunny client

Thêm biến môi trường:

```env
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_TOKEN_KEY=
BUNNY_STREAM_PULL_ZONE_HOST=
BUNNY_STREAM_WEBHOOK_SECRET=
BUNNY_STREAM_UPLOAD_EXPIRES_IN=86400
BUNNY_STREAM_PLAYBACK_EXPIRES_IN=300
```

Tasks:

- Tạo `bunny` module/service wrapper; timeout, retry có giới hạn và normalize error.
- Không log key hoặc signed token.
- Mock Bunny client cho unit/integration tests.

#### BE-02: Migration `VideoLesson`

- Mở rộng `source` thành `youtube | bunny`.
- Chuyển YouTube fields sang conditional required.
- Thêm Bunny/status/poster/backdrop/release metadata.
- Chuyển unique YouTube index sang partial unique index.
- Thêm partial unique index cho `bunnyVideoId`.
- Viết migration/backfill `streamStatus` cho dữ liệu cũ nếu cần.
- Kiểm tra tất cả create/update validation bằng Zod discriminated union theo `source`.

#### BE-03: Public/admin library query

- Tạo query aggregation trả category cùng video/count.
- Public chỉ lấy category publish có ít nhất một public playable movie.
- Admin lấy toàn bộ category, kể cả rỗng, kèm count theo status.
- Không dùng `includeUnpublished=true` để vượt quyền nếu không phải Admin.
- Thêm index phục vụ query: `contentType`, `source`, `topicId`, `isPublished`, `streamStatus`.

#### BE-04: Publish guard

- Tạo hàm domain `getMoviePublishEligibility(movie)` trả `eligible` và danh sách reason.
- Dùng cùng hàm cho API preview và mutation publish.
- Chặn publish nếu Bunny chưa ready, thiếu English subtitle hoặc category không hợp lệ.
- Khi unpublish, phim biến mất khỏi public query ngay sau cache invalidation.

#### Test Phase 1

- Unit: conditional schema, query visibility, role behavior, partial indexes.
- Integration: public/admin library, draft detail 404 với public, publish guard.

### Phase 2 - Upload Bunny và lifecycle (Tuần 3-4)

#### BE-05: Tạo upload session

- Admin `POST /movies` tạo movie draft và Bunny video object.
- Nếu Bunny create thất bại, không để bản ghi mồ côi hoặc đánh dấu failed có thể retry.
- `POST /movies/:id/upload-credentials` sinh TUS signature có expiry.
- Ràng buộc credential với đúng `libraryId`, `videoId`, Admin và movie record.

#### FE-01: Inline create/upload dialog

- Reuse Button, Input, Dialog, Select, Progress từ UI primitives hiện có.
- Form: title, category, level, release year, description, file.
- Validate file trước khi tạo upload: extension/MIME/size.
- Upload bằng `tus-js-client`, hiển thị progress, speed, trạng thái và cancel/resume.
- Lưu upload fingerprint để resume sau refresh.
- Không đóng dialog mà làm mất upload ngoài ý muốn.

#### BE-06: Bunny webhook

- Route webhook nhận raw body trước JSON parser cho đúng endpoint.
- Verify các header chữ ký Bunny và HMAC-SHA256.
- Map status sang domain state.
- Idempotent theo video ID + status; log event có correlation ID.
- Khi ready, fetch metadata nếu payload chưa đủ và cập nhật duration/thumbnail.
- Không tin `VideoGuid` nếu library ID không khớp cấu hình.

#### BE/FE-07: Recovery

- API kiểm tra lại trạng thái Bunny khi webhook chậm/mất.
- Admin action `Đồng bộ trạng thái`.
- Upload failure có resume/retry; encode failure giữ draft và hiển thị lý do.
- Scheduled reconciliation là P1 nếu webhook reliability chưa đạt.

#### Test Phase 2

- Contract test Bunny client bằng fixtures.
- Webhook signature đúng/sai, callback lặp, callback sai library.
- E2E upload nhỏ staging; manual test resume file lớn.

### Phase 3 - Subtitle workflow (Tuần 4-5)

#### BE-08: Parser và import API

- Tách parser SRT/VTT thành utility dùng ở server; không tin dữ liệu parse từ client.
- Hỗ trợ CRLF/LF, BOM, comma/dot milliseconds và cue nhiều dòng.
- Validate duration, thứ tự, text rỗng và overlap nghiêm trọng.
- API `dryRun=true` trả preview/warnings; confirm mới replace dữ liệu.
- Import transaction: chỉ xóa subtitle cũ sau khi toàn bộ file mới hợp lệ.
- Giới hạn file và số segment để chống abuse.

#### BE-09: Ghép Vietsub

- English import tạo/rebuild segment chuẩn.
- Vietnamese import ghép theo index khi số cue tương ứng và kiểm tra timestamp tolerance.
- Nếu không khớp, trả danh sách cue không match để Admin sửa; không ghép im lặng.
- Tái sử dụng generate Vietsub hiện có, lưu vào `translationText`.

#### FE-02: Subtitle workspace inline

- Upload/dropzone `.srt`, `.vtt`.
- Preview số cue, tổng duration, lỗi và warning.
- Tabs `English` / `Tiếng Việt`.
- Bảng/segment editor có start, end, text, translation và seek preview.
- Trạng thái completeness: English count, translated count, missing count.
- Publish checklist cập nhật ngay khi sửa.

#### Test Phase 3

- Fixtures: SRT hợp lệ, VTT hợp lệ, BOM, multiline, malformed, overlap, lệch EN/VI.
- Test replace atomic và rollback khi lỗi.
- E2E import English, import Vietnamese, sửa một segment, preview.

### Phase 4 - Movie Library UI kiểu Netflix (Tuần 5-6)

#### FE-03: Routing và data hooks

- Thêm `/movies`, `/movies/:id`.
- Tạo feature folder `client/src/features/movies`.
- Query keys tách library public/admin và movie detail/playback.
- Invalidate đúng key sau category, movie, publish và webhook/status update.

#### FE-04: Library components

```txt
client/src/features/movies/
├── components/
│   ├── MovieHero.jsx
│   ├── MovieCategoryRow.jsx
│   ├── MoviePosterCard.jsx
│   ├── MovieSearch.jsx
│   ├── MovieStatusBadge.jsx
│   ├── MovieAdminActions.jsx
│   └── MovieUploadDialog.jsx
├── hooks/
├── pages/
│   ├── MovieLibraryPage.jsx
│   └── MovieWatchPage.jsx
├── services/
└── utils/
```

Tasks:

- Hero dùng backdrop thật, có fallback khi thiếu ảnh.
- Category row có stable layout, arrows bằng lucide icons và keyboard access.
- Poster lazy-load, skeleton giữ tỷ lệ, error fallback.
- Public không render row rỗng; Admin render row rỗng với inline CTA thêm phim.
- Draft/processing/failed chỉ Admin thấy, có nhãn text + icon.
- Tìm kiếm không hiển thị phim không đủ quyền.
- Mobile cho phép horizontal scroll bằng touch và không tràn text.

#### FE-05: Visual QA

- Kiểm tra 375x812, 768x1024, 1440x900 và màn hình rộng.
- Không overlap header/hero/row; hint hàng đầu tiên còn nhìn thấy dưới hero.
- Kiểm tra contrast, focus, keyboard và reduced motion.
- Chụp screenshot Playwright public/admin ở mọi viewport.

### Phase 5 - Bilingual player (Tuần 6-7)

#### FE-06: Bunny player adapter

- Tạo `BunnyVideoPlayer` bọc iframe và `player.js`.
- Expose interface giống player hiện tại: play, pause, seek, currentTime, duration, events.
- Cleanup event listeners khi unmount/video đổi.
- Unique iframe source để tránh collision nếu player.js yêu cầu.
- Error boundary và retry state.

#### FE-07: Subtitle synchronization

- Tái sử dụng/khái quát hóa logic active segment từ bilingual page.
- Mode: bilingual, English, Vietnamese, off.
- Binary search segment khi seek; con trỏ tuần tự khi timeupdate.
- Overlay không chặn controls; safe-area trên mobile.
- Transcript panel click-to-seek, active highlight và auto-scroll không giật.
- Điều chỉnh cỡ chữ; lưu preference localStorage.
- Pause/play state không bị thay đổi ngoài ý muốn khi click segment.

#### BE-10: Secure playback

- `GET /movies/:id/playback` kiểm tra visibility.
- Admin preview được xem draft ready; public chỉ xem phim publish/ready.
- Sinh token server-side với TTL ngắn nếu bật embed token authentication.
- Không cache response token ở public CDN lâu hơn TTL.

#### Test Phase 5

- Unit active segment boundary, seek, mode preference.
- Integration adapter event lifecycle.
- E2E play/pause/seek, đổi mode, click transcript, refresh token/error.
- Manual cross-browser Safari/Chrome/Firefox/Edge.

### Phase 6 - Hardening, UAT và release (Tuần 8)

#### Security/performance

- Threat review upload credential, webhook, playback token và IDOR.
- Kiểm tra bundle không chứa Bunny secret.
- Rate limit và audit log admin actions.
- Load test library API và playback token endpoint.
- Theo dõi cache hit, API p95, Bunny error và player startup.

#### UAT

- Chạy toàn bộ use case trong `uc.md`.
- UAT ít nhất một file phim thực tế khoảng 2 GB và hai file subtitle.
- Test category rỗng với public/admin.
- Test unpublish khi người dùng đang ở library và direct URL.
- Kiểm tra mobile subtitle không che controls.

#### Release

- Deploy staging, cấu hình Bunny staging webhook/domain.
- Seed 2-3 category và 3 phim kiểm thử.
- Production migration có backup và rollback script.
- Bật feature flag cho Admin trước, sau đó public theo canary.
- Theo dõi 24-48 giờ trước khi mở toàn bộ traffic.

## 5. Backlog ưu tiên

### P0 - Bắt buộc để release

- Schema đa nguồn không phá YouTube.
- Upload TUS, webhook verified và state lifecycle.
- Import English subtitle và sửa segment.
- Secure playback và bilingual sync.
- Public/admin visibility, category rỗng đúng yêu cầu.
- Publish guard và inline admin controls.
- Responsive, accessibility cơ bản, logging và test critical paths.

### P1 - Làm ngay sau MVP hoặc nếu còn capacity

- Import Vietsub có matching report nâng cao.
- Scheduled reconciliation với Bunny.
- Hero featured scheduling.
- Continue watching trong localStorage cho anonymous user.
- Preview animation trên poster.
- Bulk metadata edit.

### P2 - Tương lai

- Nhiều category cho một phim.
- Series/season/episode.
- Student account và cloud watch history.
- Recommendation engine.
- DRM, subscription, geo restriction.
- Multi-audio/dubbing.

## 6. RACI rút gọn

| Hạng mục | PM/BA | UX/UI | Backend | Frontend | QA/DevOps |
| --- | --- | --- | --- | --- | --- |
| Phạm vi, rule, acceptance | A/R | C | C | C | C |
| UX Netflix-style | C | A/R | I | C | C |
| Bunny upload/webhook/security | I | I | A/R | C | C |
| Movie library/player | C | C | C | A/R | C |
| Subtitle domain/import | C | C | A/R | R | C |
| Test/UAT/release | A | C | R | R | R |

`A`: Accountable, `R`: Responsible, `C`: Consulted, `I`: Informed.

## 7. Phụ thuộc

- Bunny account, Stream library staging/production và phương thức thanh toán hợp lệ.
- Domain staging/production để cấu hình referrer/token/webhook.
- Quyền sử dụng hợp pháp các file phim, poster, backdrop và subtitle.
- Dịch vụ dịch hiện tại hoạt động và có quota phù hợp.
- MongoDB hỗ trợ migration/index không downtime đáng kể.
- QA có file test nhỏ và file thực tế khoảng 2 GB.

## 8. Rủi ro và phương án

| Rủi ro | Xác suất | Ảnh hưởng | Giảm thiểu |
| --- | --- | --- | --- |
| Upload file lớn mất kết nối | Cao | Cao | TUS resumable, fingerprint, retry/backoff, test mạng yếu |
| Webhook thất lạc hoặc đến lặp | Trung bình | Cao | Idempotency, manual sync, scheduled reconcile P1 |
| Lộ Bunny key/token | Thấp | Rất cao | Ký server-side, secret scan, log redaction, TTL ngắn |
| Subtitle lệch thời gian | Cao | Cao | Preview, waveform không thuộc MVP, offset tool P1, UAT phim thật |
| Overlay không hoạt động trong iframe fullscreen | Trung bình | Cao | Spike Phase 0, chọn player fullscreen strategy trước UI freeze |
| Query category public/admin sai quyền | Trung bình | Cao | Server role policy, integration test matrix, FE defense |
| Migration phá video YouTube | Trung bình | Cao | Conditional schema, partial index, regression test dữ liệu cũ |
| Chi phí Bunny tăng ngoài dự kiến | Trung bình | Trung bình | Monitor storage/bandwidth, budget alert, retention policy |
| Nội dung vi phạm bản quyền | Thấp/không rõ | Rất cao | Chỉ upload nội dung có quyền, takedown workflow |

## 9. Test matrix tối thiểu

| Khu vực | Public | Admin | Mobile | Desktop | API |
| --- | --- | --- | --- | --- | --- |
| Category rỗng/draft | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Upload/resume | N/A | Bắt buộc | Khuyến nghị | Bắt buộc | Bắt buộc |
| Webhook/status | N/A | Hiển thị | N/A | Bắt buộc | Bắt buộc |
| Import EN/VI | N/A | Bắt buộc | Cơ bản | Bắt buộc | Bắt buộc |
| Publish guard | Direct URL | Bắt buộc | Bắt buộc | Bắt buộc | Bắt buộc |
| Playback/subtitle | Bắt buộc | Preview | Bắt buộc | Bắt buộc | Playback auth |

## 10. Release checklist

- [ ] Bunny libraries staging/production tách biệt.
- [ ] Environment secrets đã cấu hình và rotate khỏi máy cá nhân.
- [ ] Webhook URL HTTPS và signature verification pass.
- [ ] Domain/referrer/token authentication đã test.
- [ ] Mongo migration và index được chạy trên staging copy.
- [ ] Regression test YouTube/Dictation/Shadowing/Bilingual hiện tại pass.
- [ ] Public không thấy draft, failed, processing hoặc category rỗng.
- [ ] Admin thấy category rỗng và có thể thêm phim từ đó.
- [ ] Upload/resume file thực tế pass.
- [ ] English/Vietnamese subtitle sync pass toàn phim mẫu.
- [ ] Monitoring, alert và runbook được bàn giao.
- [ ] Có rollback feature flag và rollback migration.

## 11. Definition of Ready cho từng story

- Có business rule, actor và quyền truy cập rõ.
- Có mockup/state cho desktop/mobile nếu liên quan UI.
- Có API contract và error cases.
- Có acceptance criteria kiểm thử được.
- Phụ thuộc/secret/fixture đã sẵn sàng.
- Không còn câu hỏi làm thay đổi estimate quá 20%.

## 12. Definition of Done cho từng story

- Code review hoàn tất và đúng module conventions.
- Validation ở server, không chỉ frontend.
- Unit/integration test phù hợp mức rủi ro.
- Không làm hỏng public anonymous access hoặc Admin inline controls.
- Loading/empty/error/success state hoàn chỉnh.
- Logging không chứa secret/PII.
- Build/lint/test pass và có bằng chứng UAT/screenshot nếu là UI.
