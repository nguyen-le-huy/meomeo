# Meomeo

Ứng dụng học tiếng Anh qua video YouTube, tập trung vào Dictation, Shadowing và phụ đề song ngữ.

Học sinh sử dụng ứng dụng không cần tài khoản. Admin đăng nhập để quản lý topic, video và transcript trực tiếp trên giao diện học.

## Tính năng

- Thư viện video theo topic.
- Dictation theo từng đoạn transcript.
- Shadowing, ghi âm và chấm phát âm.
- Xem video với phụ đề Anh–Việt.
- Admin quản lý nội dung ngay trên giao diện công khai.
- Phân tích metadata và transcript YouTube bằng `yt-dlp`.

## Công nghệ

- Frontend: React, Vite, Tailwind CSS, React Router, TanStack Query, Zustand.
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Zod.
- Dịch vụ: YouTube/`yt-dlp`, Azure Speech, Cloudinary, OpenAI.

## Chạy local

Yêu cầu: Node.js, npm và MongoDB.

```bash
npm install
npm install --prefix client
npm install --prefix server

cp client/.env.example client/.env
cp server/.env.example server/.env
```

Cập nhật biến môi trường trong hai file `.env`, sau đó chạy:

```bash
npm run seed:users --prefix server
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Lệnh chính

```bash
npm run dev          # Chạy frontend và backend
npm run build        # Build frontend
npm run start        # Chạy backend production
```

Xem hướng dẫn triển khai tại [docs/README.md](docs/README.md).
