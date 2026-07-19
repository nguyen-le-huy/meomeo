# Sequence Diagram - Xem phim song ngữ

## 1. Thành phần tham gia

| Thành phần | Trách nhiệm |
| --- | --- |
| Public User | Duyệt và xem phim không cần đăng nhập |
| Admin | Upload, quản lý metadata, subtitle và publish |
| React App | UI, TUS uploader, Bunny player adapter, subtitle synchronization |
| Express API | Auth/role, validation, business rules, token signing, Bunny orchestration |
| MongoDB | Movie, Topic và TranscriptSegment |
| Bunny Stream API | Tạo video, upload, encode, metadata và playback |
| Bunny Webhook | Gửi thay đổi trạng thái encode |
| Translation Service | Tạo Vietsub khi Admin chọn dịch tự động |

## 2. Admin tạo phim và upload trực tiếp lên Bunny

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB
    participant BS as Bunny Stream API

    A->>FE: Mở inline Add Movie, chọn file và nhập metadata
    FE->>FE: Validate extension, MIME, size, required fields
    FE->>API: POST /api/movies
    API->>API: Verify JWT + role admin, validate body
    API->>DB: Validate category và tạo movie draft
    API->>BS: Create video object(title)
    BS-->>API: libraryId, videoId, status queued
    API->>DB: Lưu bunnyVideoId, streamStatus=created
    API-->>FE: movieId + trạng thái draft

    FE->>API: POST /api/movies/:id/upload-credentials
    API->>API: Verify ownership/config, sign TUS credentials
    API-->>FE: libraryId, videoId, signature, expiration
    FE->>BS: TUS upload file trực tiếp
    loop Trong quá trình upload
        BS-->>FE: Upload progress
        FE-->>A: Hiển thị %, tốc độ và resume state
    end
    BS-->>FE: Upload completed
    FE->>API: PATCH /api/movies/:id/upload-completed (optional hint)
    API->>DB: streamStatus=processing
    API-->>FE: Đang xử lý video
```

Quy tắc lỗi:

- Nếu tạo Bunny object thất bại, API trả lỗi và bản ghi local phải rollback hoặc chuyển `failed` có thể retry.
- Nếu upload gián đoạn, frontend dùng TUS fingerprint để resume; không tạo Bunny video mới.
- `upload-completed` chỉ là hint UX. Webhook/đối soát Bunny mới là nguồn xác nhận trạng thái.

## 3. Bunny encode và webhook cập nhật trạng thái

```mermaid
sequenceDiagram
    autonumber
    participant BS as Bunny Stream
    participant API as Express Webhook
    participant DB as MongoDB
    participant LOG as Logs/Monitoring
    participant FE as Admin React App

    BS->>API: POST /api/webhooks/bunny/stream + signature headers
    API->>API: Đọc raw body và verify HMAC signature
    alt Chữ ký hoặc library ID không hợp lệ
        API->>LOG: Security warning, redacted payload
        API-->>BS: 401/400
    else Hợp lệ
        API->>DB: Tìm movie bằng bunnyVideoId
        alt Event cũ/lặp
            API->>LOG: Mark duplicate/no-op
            API-->>BS: 200 OK
        else Status queued/processing/encoding
            API->>DB: streamStatus=processing
            API-->>BS: 200 OK
        else Status finished/playable
            API->>BS: GET video metadata nếu cần
            BS-->>API: duration, thumbnail, dimensions, status
            API->>DB: streamStatus=ready, metadata, streamReadyAt
            API-->>BS: 200 OK
        else Status failed
            API->>DB: streamStatus=failed, streamError
            API->>LOG: Emit encoding failure metric
            API-->>BS: 200 OK
        end
    end

    FE->>API: GET /api/movies/:id/stream-status
    API->>DB: Read current state
    API-->>FE: status + admin-safe error
```

## 4. Admin import English subtitle

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant PARSER as SRT/VTT Parser
    participant DB as MongoDB

    A->>FE: Chọn hoặc paste English .srt/.vtt
    FE->>API: POST /movies/:id/subtitles/en/import?dryRun=true
    API->>API: Verify admin, file size/type
    API->>PARSER: Parse và normalize cues
    PARSER-->>API: segments + errors + warnings
    alt Có lỗi nghiêm trọng
        API-->>FE: 422 + lỗi theo cue/dòng
        FE-->>A: Hiển thị lỗi, không thay dữ liệu cũ
    else Hợp lệ
        API-->>FE: Preview count, duration, overlap warnings
        A->>FE: Xác nhận thay subtitle English
        FE->>API: POST import?dryRun=false
        API->>PARSER: Parse lại ở server
        API->>DB: Transaction replace TranscriptSegments
        DB-->>API: Saved segment count
        API->>DB: transcriptStatus=completed
        API-->>FE: Import completed + publish checklist
    end
```

## 5. Admin import Vietnamese subtitle và matching

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB

    A->>FE: Chọn Vietnamese SRT/VTT
    FE->>API: POST /movies/:id/subtitles/vi/import?dryRun=true
    API->>DB: Load English segments
    API->>API: Parse VI và match theo index/timestamp tolerance
    alt Không thể match an toàn
        API-->>FE: 422 + matched/unmatched/conflict report
        FE-->>A: Yêu cầu sửa file hoặc map thủ công
    else Match được
        API-->>FE: Preview matched count + warnings
        A->>FE: Xác nhận import
        FE->>API: POST import?dryRun=false
        API->>DB: Atomic update translationText
        API->>DB: bilingualStatus=completed nếu đủ
        API-->>FE: Translation completeness
    end
```

Không được match chỉ dựa vào số thứ tự mà bỏ qua timestamp; điều này có thể gắn sai bản dịch từ giữa phim nếu một file thiếu cue.

## 6. Admin tạo Vietsub tự động

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB
    participant TR as Translation Service

    A->>FE: Chọn Tạo Vietsub
    FE->>API: POST /api/videos/:id/generate-vietsub
    API->>DB: Validate movie + English segments
    API->>DB: bilingualStatus=processing
    API->>TR: Translate batches with context
    alt Translation failed
        TR-->>API: Error/partial result
        API->>DB: bilingualStatus=failed, bilingualError
        API-->>FE: Failed + retryable message
    else Translation completed
        TR-->>API: Vietnamese texts
        API->>DB: Update translationText atomically/by batch policy
        API->>DB: bilingualStatus=completed, generatedAt
        API-->>FE: Completed + segment count
    end
```

## 7. Admin preview và publish phim

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB

    A->>FE: Mở phim draft để preview
    FE->>API: GET /api/movies/:id
    API->>DB: Load draft movie + subtitle completeness
    API-->>FE: Detail + publish eligibility reasons
    FE-->>A: Player preview và checklist

    A->>FE: Chọn Publish
    FE->>API: PATCH /api/movies/:id/publish {isPublished:true}
    API->>DB: Load movie, category, English segment count
    API->>API: Evaluate publish eligibility
    alt Không đủ điều kiện
        API-->>FE: 409 + reason codes
        FE-->>A: Checklist lỗi có action sửa
    else Đủ điều kiện
        API->>DB: isPublished=true, publishedAt=now
        API->>API: Invalidate public library cache
        API-->>FE: Published movie
        FE-->>A: Cập nhật nhãn Published
    end
```

## 8. Public tải thư viện và quy tắc category rỗng

```mermaid
sequenceDiagram
    autonumber
    actor U as Public User
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB

    U->>FE: Mở /movies
    FE->>API: GET /api/movies/library
    API->>DB: Aggregate published topics + public playable movies
    DB-->>API: Category rows với movieCount > 0
    API-->>FE: Hero candidate + non-empty categories
    FE->>FE: Defensive filter rows có videos.length > 0
    FE-->>U: Hero và carousel phim
```

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB

    A->>FE: Mở /movies sau khi đăng nhập
    FE->>API: GET /api/movies/library?includeUnpublished=true
    API->>API: optionalAuth xác định role=admin
    API->>DB: Aggregate tất cả topics và movies
    DB-->>API: Kể cả category rỗng/draft
    API-->>FE: Counts và status summaries
    FE-->>A: Hiển thị mọi category + inline controls
```

Nếu public cố gắn `includeUnpublished=true`, backend vẫn áp dụng public filter.

## 9. Public mở phim và nhận playback URL

```mermaid
sequenceDiagram
    autonumber
    actor U as Public User
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB
    participant BP as Bunny Player

    U->>FE: Chọn một phim
    FE->>API: GET /api/movies/:id
    API->>DB: Find public published+ready movie và subtitle
    alt Không tồn tại hoặc không đủ quyền
        API-->>FE: 404
        FE-->>U: Nội dung không khả dụng
    else Hợp lệ
        API-->>FE: Metadata + TranscriptSegments
        FE->>API: GET /api/movies/:id/playback
        API->>DB: Re-check visibility/streamStatus
        API->>API: Generate short-lived embed token
        API-->>FE: embedUrl, token/expires hoặc signed URL
        FE->>BP: Mount iframe player
        BP-->>FE: ready
        FE-->>U: Player sẵn sàng
    end
```

## 10. Đồng bộ player và phụ đề song ngữ

```mermaid
sequenceDiagram
    autonumber
    actor U as Public User
    participant FE as React App
    participant BP as Bunny Player via player.js
    participant SYNC as Subtitle Sync Engine

    U->>BP: Play
    BP-->>FE: play
    loop Trong khi đang phát
        BP-->>FE: timeupdate(seconds, duration)
        FE->>SYNC: Resolve active segment(currentTime)
        SYNC-->>FE: activeSegment hoặc null
        FE-->>U: Render EN/VI theo subtitle mode
    end

    U->>FE: Click một câu trong transcript
    FE->>BP: seek(startTime)
    BP-->>FE: seeked + timeupdate
    FE->>SYNC: Resolve segment tại startTime
    FE-->>U: Highlight và scroll segment

    U->>FE: Chuyển mode English/Vietnamese/Bilingual/Off
    FE->>FE: Update preference + localStorage
    FE-->>U: Render mode mới, không reload video
```

## 11. Unpublish và truy cập direct URL

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    actor U as Public User
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB

    A->>FE: Unpublish movie
    FE->>API: PATCH /movies/:id/publish {isPublished:false}
    API->>DB: Update isPublished=false
    API->>API: Invalidate public cache
    API-->>FE: Success

    U->>API: GET /movies/:id hoặc /playback
    API->>DB: Query với public visibility
    DB-->>API: Not found
    API-->>U: 404
```

Token playback đã cấp có thể còn hiệu lực đến hết TTL. Vì vậy TTL cần ngắn; unpublish không được hiểu là thu hồi tức thời tuyệt đối nếu không có cơ chế token revocation ở CDN.

## 12. Xóa phim an toàn

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant FE as React App
    participant API as Express API
    participant DB as MongoDB
    participant BS as Bunny Stream API

    A->>FE: Chọn xóa phim và xác nhận tên phim
    FE->>API: DELETE /api/movies/:id?deleteAsset=false
    API->>DB: Mark deletedAt, isPublished=false
    API-->>FE: Soft deleted

    opt Admin có quyền cleanup asset riêng
        A->>FE: Xác nhận xóa vĩnh viễn Bunny asset
        FE->>API: DELETE /api/movies/:id/asset
        API->>BS: Delete Bunny video
        alt Bunny success/not found
            API->>DB: Mark assetDeletedAt
            API-->>FE: Asset removed
        else Bunny unavailable
            API->>DB: Mark cleanupPending
            API-->>FE: 202 cleanup pending
        end
    end
```

## 13. Correlation và audit

Mỗi luồng Admin/Bunny quan trọng cần có:

- `requestId` cho API request.
- `movieId`, `bunnyVideoId` và `adminUserId` trong structured log, không log secret.
- Audit event: `movie.created`, `upload.credentials_issued`, `stream.status_changed`, `subtitle.imported`, `movie.published`, `movie.unpublished`, `movie.deleted`.
- Webhook log có signature result, status cũ/mới và idempotency result.
