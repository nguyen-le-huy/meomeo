# Hướng dẫn Deploy Devenir (MeoMeo) lên Server Linux

> **Tài liệu này hướng dẫn chi tiết cách deploy dự án YouTube Shadowing & Dictation lên server Linux với domain `meomeo.devenir.shop` thông qua Cloudflare Tunnel.**

## 1. Yêu cầu hệ thống
- Server chạy **Linux (Ubuntu/Debian)** đã cài sẵn **Docker** và **Docker Compose**.
- Domain hoặc tài khoản **Cloudflare** chứa domain `devenir.shop`.
- Source code đã được tải về máy chủ Linux (ví dụ tại `~/Development/meomeo`).

## 2. Chuẩn bị Biến môi trường (.env)

Việc quan trọng đầu tiên là chuyển các callback và URL về domain `meomeo.devenir.shop`.

**A. Tạo/Sửa file `server/.env`:**
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://meomeo.devenir.shop
API_PUBLIC_URL=https://meomeo-api.devenir.shop
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=southeastasia
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=123456

# Cloudflare R2 dùng cho file ebook; ảnh bìa vẫn dùng Cloudinary.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=meomeo
R2_REGION=auto
R2_ENDPOINT=
R2_EBOOK_PREFIX=ebooks
R2_PUBLIC_BASE_URL=
```

**B. Tạo/Sửa file `client/.env.production`:**
```env
VITE_API_URL=https://meomeo-api.devenir.shop/api
```

## 3. Cập nhật CORS Backend

Bạn cần trỏ Origin mới nhất trong tệp khởi tạo Server.
Mở file `server/src/app.js` (hoặc `server.js`) và thêm domain vào mốc `allowedOrigins`:
```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://meomeo.devenir.shop",
];
```

> Khi backend chạy sau Cloudflare Tunnel/Nginx, `API_PUBLIC_URL` phải là HTTPS URL public của API. Nếu không, URL file ebook R2 có thể bị build thành `http://.../api/ebooks/:id/file` và trình duyệt sẽ chặn vì Mixed Content.

## 4. Build & Khởi động Docker

Chạy lệnh sau tại thư mục gốc của project (nơi chứa file `docker-compose.yml`):
```bash
# Build và chạy ngầm (Detached mode)
docker compose up -d --build

# Kiểm tra đảm bảo Server (port 5000) và Client (port 5180/80) đang Up
docker compose ps
```

## 5. Cài đặt và cấu hình Cloudflare Tunnel
Phương pháp này giúp Public Server Linux của bạn ra Internet an toàn mà không cần mở Port Router.

### 5.1. Cài đặt `cloudflared`
```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared noble main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt-get update && sudo apt-get install cloudflared -y
```

### 5.2. Đăng nhập và Tạo Tunnel
```bash
# Đăng nhập (Copy link terminal cấp quyền trên trình duyệt)
cloudflared tunnel login

# Tạo tunnel mới
cloudflared tunnel create meomeo
# -> Copy và lữu UUID của Tunnel được trả về!
```

### 5.3. Trỏ Map Domains (DNS)
```bash
cloudflared tunnel route dns meomeo meomeo.devenir.shop
cloudflared tunnel route dns meomeo meomeo-api.devenir.shop
```

### 5.4. Tạo file cấu hình Routing Config
Tạo tệp tại `~/.cloudflared/config.yml` với nội dung ánh xạ về ứng dụng:
```yaml
tunnel: <Thay-Bằng-TUNNEL_UUID>
credentials-file: /etc/cloudflared/<Thay-Bằng-TUNNEL_UUID>.json

ingress:
  # API Backend -> Server Container Port 5000
  - hostname: meomeo-api.devenir.shop
    service: http://localhost:5000
    
  # Main Frontend App -> Client Container Port 5180
  - hostname: meomeo.devenir.shop
    service: http://localhost:5180

  # Bắt buộc: Catch-all rule cho 404
  - service: http_status:404
```

### 5.5. Cài đặt Service tự chạy bằng Systemd
```bash
sudo mkdir -p /etc/cloudflared

# Đẩy các cấu hình vào thư mục /etc
sudo cp ~/.cloudflared/config.yml /etc/cloudflared/
sudo cp ~/.cloudflared/*.json /etc/cloudflared/

# Cài đặt và Start service Cloudflare
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## 6. Kiểm tra Hậu kiểm deployment
Mọi thứ lúc này sẽ đã online và sẵn sàng sử dụng:
🌐 **Web App:** [https://meomeo.devenir.shop](https://meomeo.devenir.shop)
🔌 **API/Server:** [https://meomeo-api.devenir.shop](https://meomeo-api.devenir.shop)

### Các câu lệnh Useful Tracking Log:
```bash
# Log Docker Backend/Frontend
docker compose logs -f server
docker compose logs -f client

# Log Cloudflare Network Issues
sudo journalctl -u cloudflared -f
```
