# Use Case Specification - Xem phim song ngữ

## 1. Actors

| Actor | Mô tả |
| --- | --- |
| Public User | Người dùng anonymous duyệt và xem phim |
| Admin | Người duy nhất đăng nhập, quản lý nội dung bằng inline controls |
| Bunny Stream | Hệ thống ngoài lưu, encode và phát video |
| Translation Service | Hệ thống ngoài tạo Vietsub tự động |

## 2. Danh sách use case

| ID | Use case | Actor chính | Ưu tiên |
| --- | --- | --- | --- |
| UC-01 | Duyệt thư viện phim theo category | Public User/Admin | P0 |
| UC-02 | Tìm kiếm và mở chi tiết phim | Public User/Admin | P0 |
| UC-03 | Xem phim với phụ đề song ngữ | Public User/Admin | P0 |
| UC-04 | Tạo và upload phim lên Bunny | Admin | P0 |
| UC-05 | Import/chỉnh sửa phụ đề English | Admin | P0 |
| UC-06 | Tạo hoặc import Vietsub | Admin | P0 |
| UC-07 | Preview và publish/unpublish phim | Admin | P0 |
| UC-08 | Quản lý category rỗng/draft | Admin | P0 |
| UC-09 | Sửa metadata và trạng thái phim | Admin | P0 |
| UC-10 | Xóa phim an toàn | Admin | P1 |

## UC-01: Duyệt thư viện phim theo category

**Mục tiêu:** Người dùng xem danh sách category có nội dung hợp lệ; Admin xem được toàn bộ category.

**Tiền điều kiện:** Web và API hoạt động. Không yêu cầu đăng nhập với public.

**Kích hoạt:** Actor truy cập `/movies`.

**Luồng chính:**

1. Frontend yêu cầu movie library.
2. Backend xác định actor từ optional auth.
3. Với public, backend lấy category publish có ít nhất một phim public playable.
4. Với Admin, backend lấy mọi category và phim, kể cả draft/processing/failed.
5. Frontend chọn phim nổi bật hợp lệ cho hero.
6. Frontend hiển thị category rows đúng thứ tự.
7. Actor scroll/click để khám phá phim.

**Luồng thay thế:**

- A1: Không có phim public nào: public thấy empty state, không thấy category rỗng.
- A2: Admin có category rỗng: hiển thị tên category, nhãn `0 phim public` và action thêm phim.
- A3: API lỗi: hiển thị retry state, không render dữ liệu stale sai quyền.

**Hậu điều kiện:** Không thay đổi dữ liệu.

**Acceptance criteria:**

- [ ] Public không thấy category có `videos.length = 0` sau khi áp dụng điều kiện public playable.
- [ ] Public không thấy category draft hoặc phim draft/processing/failed.
- [ ] Admin thấy category rỗng, category draft và số lượng phim theo trạng thái.
- [ ] Gắn `includeUnpublished=true` khi không phải Admin không làm lộ dữ liệu.
- [ ] Category hệ thống `all-videos` không hiển thị như category nội dung.
- [ ] Poster và row không layout shift đáng kể khi tải ảnh.

## UC-02: Tìm kiếm và mở chi tiết phim

**Mục tiêu:** Actor tìm phim theo tiêu đề/mô tả và mở trang xem.

**Tiền điều kiện:** Actor đang ở `/movies`.

**Luồng chính:**

1. Actor nhập từ khóa.
2. Frontend debounce request hoặc lọc trên dataset đã được backend cấp quyền.
3. Backend áp dụng search cùng visibility filter.
4. Frontend hiển thị kết quả và metadata ngắn.
5. Actor chọn phim.
6. Frontend điều hướng `/movies/:id`.
7. Backend trả detail/transcript nếu actor có quyền.

**Ngoại lệ:**

- E1: Từ khóa không có kết quả: hiển thị empty search state.
- E2: Public mở URL phim draft: trả 404, không trả metadata nhạy cảm.
- E3: Phim vừa bị unpublish: detail/playback request mới trả 404.

**Acceptance criteria:**

- [ ] Search không làm lộ draft qua title suggestion hoặc count.
- [ ] Enter/click/tap đều mở đúng phim.
- [ ] Direct URL unauthorized trả 404 thay vì tiết lộ trạng thái tồn tại.
- [ ] Admin có thể mở draft để preview.

## UC-03: Xem phim với phụ đề song ngữ

**Mục tiêu:** Người dùng xem phim và học theo English/Vietnamese subtitle đồng bộ.

**Tiền điều kiện:** Phim public playable; Admin có thể preview phim `ready` chưa publish.

**Luồng chính:**

1. Frontend tải metadata và transcript segments.
2. Frontend yêu cầu playback URL/token.
3. Backend kiểm tra quyền và ký token có TTL ngắn.
4. Bunny player phát sự kiện `ready`.
5. Người dùng play video.
6. Mỗi `timeupdate`, app xác định active segment.
7. Overlay hiển thị English và Vietnamese theo mode mặc định `Song ngữ`.
8. Transcript panel highlight câu hiện tại.
9. Người dùng bấm một câu; player seek tới `startTime`.
10. Người dùng chuyển mode subtitle mà video không reload.

**Luồng thay thế:**

- A1: Segment không có `translationText`: mode song ngữ vẫn hiển thị English và không render dòng Việt rỗng.
- A2: Khoảng thời gian không có cue: overlay ẩn, player tiếp tục.
- A3: Playback token hết hạn trước khi khởi tạo: frontend yêu cầu token mới một lần.
- A4: Player error: hiển thị retry và correlation code.
- A5: Mobile xoay màn hình: player giữ tỷ lệ và subtitle không che controls.

**Acceptance criteria:**

- [ ] Active cue đúng tại biên `startTime <= t < endTime`.
- [ ] Seek từ transcript sai lệch không quá 300 ms trong điều kiện test.
- [ ] Có 4 mode: Song ngữ, English, Tiếng Việt, Tắt.
- [ ] Preference mode/cỡ chữ được lưu localStorage.
- [ ] Không có secret hoặc token dài hạn trong source/bundle.
- [ ] Public không lấy được playback của draft/processing/failed movie.
- [ ] Event listeners được cleanup khi rời page.

## UC-04: Tạo và upload phim lên Bunny

**Mục tiêu:** Admin upload file phim lớn ổn định và theo dõi encode.

**Tiền điều kiện:** Admin đã đăng nhập; Bunny environment hợp lệ; category tồn tại.

**Luồng chính:**

1. Admin mở `Thêm phim` trong public movie library.
2. Admin chọn category, nhập title và chọn file.
3. Frontend validate input.
4. Backend tạo movie draft và Bunny video object.
5. Backend cấp TUS upload credentials có thời hạn.
6. Frontend upload file trực tiếp lên Bunny.
7. UI hiển thị progress và trạng thái.
8. Bunny xử lý/encode và gửi webhook.
9. Backend xác thực webhook, cập nhật `streamStatus`.
10. Khi `ready`, Admin có thể preview player.

**Ngoại lệ:**

- E1: File sai loại/quá dung lượng: chặn trước khi tạo upload.
- E2: Bunny create lỗi: không tạo record mồ côi không thể phục hồi.
- E3: Mất mạng: TUS giữ resume fingerprint và cho tiếp tục.
- E4: Credential hết hạn: frontend xin credential mới cho cùng video.
- E5: Encode failed: giữ draft, hiển thị lỗi và action retry/re-upload.
- E6: Webhook không đến: Admin dùng `Đồng bộ trạng thái`.

**Acceptance criteria:**

- [ ] Bunny API key không được gửi về browser.
- [ ] File không đi qua Express server.
- [ ] Upload có progress và resume sau gián đoạn trong test case hỗ trợ.
- [ ] Webhook sai signature bị từ chối.
- [ ] Webhook lặp không làm sai state.
- [ ] Movie không tự publish khi encode xong.
- [ ] Upload/encode state vẫn nhìn thấy sau refresh.

## UC-05: Import và chỉnh sửa phụ đề English

**Mục tiêu:** Admin tạo bộ English segments chuẩn cho phim.

**Tiền điều kiện:** Movie draft tồn tại; Admin đăng nhập.

**Luồng chính:**

1. Admin chọn import English subtitle.
2. Admin chọn/paste SRT hoặc VTT.
3. Backend parse dry-run và trả preview.
4. UI hiển thị cue count, duration, warnings và errors.
5. Admin xác nhận replace.
6. Backend parse lại, validate và replace atomically.
7. UI mở segment editor.
8. Admin sửa text/start/end và preview bằng seek.
9. Hệ thống cập nhật transcript completeness.

**Ngoại lệ:**

- E1: Encoding không phải UTF-8/BOM lỗi: trả thông báo rõ.
- E2: Timestamp không hợp lệ hoặc `end <= start`: từ chối cue/file theo policy.
- E3: Overlap: warning hoặc error tùy ngưỡng.
- E4: Confirm import lỗi: subtitle cũ còn nguyên.

**Acceptance criteria:**

- [ ] Hỗ trợ SRT/VTT, CRLF/LF, milliseconds comma/dot và cue nhiều dòng.
- [ ] Server là nơi parse/validate cuối cùng.
- [ ] Dry-run không ghi database.
- [ ] Import lỗi không xóa subtitle cũ.
- [ ] Segment lưu theo thứ tự và có normalized timing.
- [ ] Không publish phim nếu không có English segment hợp lệ.

## UC-06: Tạo hoặc import Vietsub

**Mục tiêu:** Admin bổ sung `translationText` cho English segments.

**Tiền điều kiện:** Có English transcript segments.

**Luồng A - Dịch tự động:**

1. Admin chọn `Tạo Vietsub`.
2. Backend đánh dấu processing và gửi các batch đến Translation Service.
3. Kết quả được map đúng segment.
4. Backend cập nhật `translationText` và completeness.
5. Admin review/sửa từng câu.

**Luồng B - Import file Việt:**

1. Admin chọn Vietnamese SRT/VTT.
2. Backend parse và match với English theo timestamp/index có tolerance.
3. UI hiển thị matched, unmatched và conflict.
4. Admin chỉ xác nhận nếu mapping an toàn.
5. Backend cập nhật translation atomically.

**Ngoại lệ:**

- E1: Một cue English bị thiếu trong file Việt: không shift hàng loạt bản dịch.
- E2: Translation Service lỗi: trạng thái failed, cho retry, giữ dữ liệu đã được xác nhận theo policy.
- E3: Admin sửa thủ công trong lúc job dịch chạy: phải khóa hoặc dùng version check để không overwrite.

**Acceptance criteria:**

- [ ] Không cho chạy dịch nếu English transcript rỗng.
- [ ] Import Việt có matching report trước khi ghi.
- [ ] Không gắn sai toàn bộ phần sau chỉ vì thiếu một cue.
- [ ] Admin sửa được từng `translationText`.
- [ ] Nhãn song ngữ chỉ `completed` theo completeness rule đã định.

## UC-07: Preview và publish/unpublish phim

**Mục tiêu:** Admin chỉ đưa nội dung đủ điều kiện ra public.

**Tiền điều kiện:** Movie draft tồn tại.

**Luồng chính:**

1. Admin mở preview.
2. UI tải draft detail, playback và subtitle bằng quyền Admin.
3. UI hiển thị publish checklist.
4. Admin kiểm tra hình, tiếng, metadata và subtitle.
5. Admin chọn Publish.
6. Backend tự đánh giá lại điều kiện.
7. Backend lưu publish và invalidates cache.
8. Movie xuất hiện trong category public.

**Publish guard bắt buộc:**

- Bunny `ready`.
- `source=bunny`, `contentType=movie` cho scope này.
- Title/category/poster hoặc fallback cần thiết đã có.
- Có English transcript segment publish.
- Category được publish tại thời điểm public display.
- Không soft deleted.

**Unpublish:**

1. Admin chọn Unpublish.
2. Backend cập nhật ngay và invalidates public cache.
3. Library/detail/playback request mới không còn truy cập public.

**Acceptance criteria:**

- [ ] API direct không thể bypass publish guard.
- [ ] Lỗi trả reason code đủ để UI dẫn tới thao tác sửa.
- [ ] Publish không bị kích hoạt tự động sau upload/import.
- [ ] Unpublish làm phim/category rỗng biến mất khỏi public query.
- [ ] Admin vẫn thấy và preview phim unpublished.

## UC-08: Quản lý category rỗng/draft

**Mục tiêu:** Admin chuẩn bị category trước khi có phim mà public không thấy section rỗng.

**Tiền điều kiện:** Admin đăng nhập.

**Luồng chính:**

1. Admin mở quản lý category inline.
2. Admin tạo category với name, description, order và publish status.
3. Category mới xuất hiện trong Admin library dù chưa có phim.
4. Admin có thể đổi tên, thứ tự và publish status.
5. Khi category có phim public playable, category mới xuất hiện với public.

**Ngoại lệ:**

- E1: Admin xóa category có phim: backend trả 409.
- E2: Category publish nhưng rỗng: vẫn ẩn public.
- E3: Phim cuối cùng bị unpublish: category tự biến mất public nhưng vẫn còn với Admin.
- E4: Category draft có phim publish do dữ liệu cũ: toàn bộ category/phim vẫn ẩn public.

**Acceptance criteria:**

- [ ] Admin luôn thấy category rỗng.
- [ ] Public luôn không thấy category rỗng.
- [ ] Empty được tính theo phim `public playable`, không theo tổng số record.
- [ ] Thay đổi thứ tự phản ánh đúng ở public với category đủ điều kiện.
- [ ] Xóa category có phim bị chặn.

## UC-09: Sửa metadata và trạng thái phim

**Mục tiêu:** Admin cập nhật nội dung hiển thị mà không tạo lại video.

**Luồng chính:**

1. Admin chọn Edit trên poster/detail.
2. Sửa title, description, category, level, release year, poster/backdrop hoặc featured.
3. Frontend và backend validate.
4. Backend cập nhật record và invalidates cache liên quan.
5. UI phản ánh thay đổi.

**Acceptance criteria:**

- [ ] Đổi category cập nhật cả category cũ và mới.
- [ ] Public không thấy metadata mới của draft.
- [ ] Không cho sửa `bunnyVideoId` bằng form thông thường.
- [ ] Không cho đặt `streamStatus=ready` thủ công qua generic update API.
- [ ] Optimistic update phải rollback nếu API lỗi.

## UC-10: Xóa phim an toàn

**Mục tiêu:** Gỡ phim khỏi sản phẩm mà tránh mất asset do thao tác nhầm.

**Tiền điều kiện:** Admin đăng nhập và có quyền xóa.

**Luồng chính:**

1. Admin chọn Delete.
2. UI giải thích soft delete và yêu cầu xác nhận.
3. Backend đặt `deletedAt`, `isPublished=false`.
4. Public không còn thấy/truy cập phim.
5. Admin có thể khôi phục trong retention window.

**Luồng xóa asset vĩnh viễn:**

1. Admin chọn cleanup asset riêng.
2. UI yêu cầu nhập tên phim/xác nhận mạnh.
3. Backend gọi Bunny delete.
4. Backend đánh dấu asset deleted hoặc cleanup pending.

**Acceptance criteria:**

- [ ] Xóa thông thường không xóa Bunny asset ngay.
- [ ] Public mất quyền truy cập ngay sau soft delete, trừ signed URL cũ đến hết TTL.
- [ ] Bunny delete lỗi không làm mất trạng thái cần retry.
- [ ] Transcript chỉ hard-delete theo retention/cleanup policy.

## 3. Ma trận quyền

| Hành động | Public | Admin |
| --- | --- | --- |
| Xem category có phim public playable | Có | Có |
| Xem category rỗng/draft | Không | Có |
| Xem phim publish/ready | Có | Có |
| Preview phim draft ready | Không | Có |
| Xem phim processing/failed | Không | Metadata/status |
| Upload phim | Không | Có |
| Import/sửa subtitle | Không | Có |
| Publish/unpublish | Không | Có |
| Sửa/xóa category/phim | Không | Có |

## 4. Business rule IDs

| ID | Quy tắc |
| --- | --- |
| BR-01 | Public không cần đăng nhập |
| BR-02 | Chỉ role `admin` có mutation content |
| BR-03 | Category public phải publish và có ít nhất một public playable movie |
| BR-04 | Admin thấy mọi category kể cả rỗng |
| BR-05 | Phim chỉ publish khi Bunny ready và có English subtitle |
| BR-06 | Signed playback data được tạo server-side và có TTL ngắn |
| BR-07 | Bunny webhook chỉ được chấp nhận khi chữ ký và library hợp lệ |
| BR-08 | Import subtitle lỗi không được phá dữ liệu đang có |
| BR-09 | MVP mỗi phim thuộc một category chính |
| BR-10 | Xóa mặc định là soft delete; hard delete asset là action riêng |
