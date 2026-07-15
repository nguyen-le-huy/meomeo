# CI/CD Docker cho MeoMeo

Tài liệu này ghi lại cấu hình build/deploy Docker production cho `meomeo.devenir.shop`.

## 1. Domain production

- Frontend: `https://meomeo.devenir.shop`
- Backend API: `https://meomeo-api.devenir.shop`
- Local backend container: `http://localhost:5000`
- Local frontend container: `http://localhost:5180`

## 2. Biến môi trường backend

File `server/.env` trên server cần có các biến tối thiểu:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://meomeo.devenir.shop
API_PUBLIC_URL=https://meomeo-api.devenir.shop

MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Ebook file lưu trên Cloudflare R2; ảnh bìa vẫn dùng Cloudinary.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=meomeo
R2_REGION=auto
R2_ENDPOINT=
R2_EBOOK_PREFIX=ebooks
R2_PUBLIC_BASE_URL=

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
```

`API_PUBLIC_URL` rất quan trọng khi chạy sau Cloudflare Tunnel/Nginx. Backend dùng biến này để trả về URL đọc file ebook R2 dạng:

```txt
https://meomeo-api.devenir.shop/api/ebooks/:id/file
```

Nếu thiếu biến này hoặc proxy không forward `X-Forwarded-Proto=https`, frontend HTTPS có thể nhận URL `http://.../file` và bị trình duyệt chặn bằng lỗi Mixed Content.

## 3. Biến môi trường frontend

Khi build Docker image client, `VITE_API_URL` phải là HTTPS URL:

```env
VITE_API_URL=https://meomeo-api.devenir.shop/api
```

Trong `docker-compose.yml`, build arg hiện tại:

```yaml
client:
  build:
    context: ./client
    dockerfile: Dockerfile
    args:
      - VITE_API_URL=https://meomeo-api.devenir.shop/api
```

## 4. Build và chạy lại

```bash
docker compose down
docker compose up -d --build
docker compose ps
```

Nếu chỉ thay `server/.env` mà không đổi frontend build arg:

```bash
docker compose up -d --build server
```

Nếu thay `VITE_API_URL` hoặc source frontend:

```bash
docker compose up -d --build client
```

## 5. Smoke test sau deploy

```bash
curl -I https://meomeo-api.devenir.shop/api/health
curl -s https://meomeo-api.devenir.shop/api/health
```

Mở DevTools ở trang đọc ebook R2 và kiểm tra API trả về `fileUrl` phải bắt đầu bằng HTTPS:

```txt
https://meomeo-api.devenir.shop/api/ebooks/<ebookId>/file
```

Các cảnh báo như `static.cloudflareinsights.com ... ERR_BLOCKED_BY_CLIENT` hoặc `Tracking Prevention blocked access to storage` thường đến từ browser/ad blocker/privacy mode, không phải lỗi reader. Lỗi cần xử lý là `Mixed Content`.
