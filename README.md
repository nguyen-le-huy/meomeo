# Meomeo

Meomeo là ứng dụng học tiếng Anh qua YouTube, tập trung vào Shadowing, Dictation, transcript, phụ đề song ngữ và các nội dung đọc bổ trợ.

Học viên sử dụng ứng dụng không cần tài khoản. Admin là vai trò đăng nhập duy nhất và quản lý nội dung bằng inline controls ngay trong giao diện học công khai. MVP không dùng dashboard admin riêng và không có student login.

## Tính năng chính

- Thư viện topic và video YouTube công khai.
- Admin inline quản lý topic, video và transcript.
- Phân tích metadata/transcript YouTube bằng `yt-dlp`/`yt-dlp-exec`.
- Lưu và chỉnh sửa transcript segment.
- Dictation theo từng đoạn transcript.
- Shadowing, ghi âm trên browser và chấm phát âm bằng Azure Speech.
- Xem video với phụ đề Anh-Việt.
- Reading practice, bilingual watch, dictionary lookup và media hỗ trợ học tập.
- Kế hoạch tích hợp ebook reader online cho EPUB/PDF, bookmark, theme, font và lưu vị trí đọc.

## Kế hoạch ebook reader

Tính năng ebook đang được thiết kế để bổ sung vào cùng sản phẩm:

- Admin upload ebook EPUB/PDF.
- Lưu metadata ebook trong MongoDB, lưu file ở Cloudinary raw hoặc storage tương đương.
- Public user xem thư viện ebook và đọc trực tiếp trên web.
- Reader hỗ trợ chỉnh cỡ chữ, font, theme, bookmark và restore vị trí đọc.
- Vì web dùng một người dùng public, progress/bookmark dùng `sessionId` ẩn danh và local storage, không cần student login.

Xem bản kế hoạch chi tiết tại [docs/ebook-reader-plan.md](docs/ebook-reader-plan.md).

## Công nghệ

Frontend:

- React
- Vite
- Tailwind CSS
- React Router DOM
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios
- `epubjs` và `pdfjs-dist` cho kế hoạch ebook reader
- `lucide-react` cho icon UI

Backend:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Zod
- Multer
- Cloudinary
- `yt-dlp-exec`
- Azure Speech SDK
- OpenAI services cho một số tính năng media/dictionary

## Cấu trúc thư mục

```txt
.
├── client/                 # Frontend React/Vite
├── server/                 # Backend Express/Mongoose
├── docs/                   # Tài liệu setup, deploy và kế hoạch tính năng
├── docker-compose.yml
└── package.json            # Lệnh monorepo
```

Frontend dùng feature folders trong `client/src/features` và UI primitives trong `client/src/components/ui`.

Backend dùng module structure:

```txt
module-name/
├── module-name.model.js
├── module-name.routes.js
├── module-name.controller.js
├── module-name.service.js
└── module-name.validation.js
```

Controller chỉ xử lý request/response, service chứa business logic, route chỉ định nghĩa endpoint/middleware, validation dùng Zod.

## Yêu cầu local

- Node.js
- npm
- MongoDB local hoặc MongoDB Atlas
- Tài khoản Cloudinary nếu dùng upload media
- Azure Speech resource nếu dùng pronunciation assessment
- `yt-dlp` binary được cài qua `yt-dlp-exec` postinstall trong server

## Cài đặt local

```bash
npm install
npm install --prefix client
npm install --prefix server

cp client/.env.example client/.env
cp server/.env.example server/.env
```

Cập nhật biến môi trường trong hai file `.env`.

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend tối thiểu:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=southeastasia
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=123456
```

Các biến OpenAI/Cambridge Dictionary trong `server/.env.example` chỉ cần cấu hình khi dùng những tính năng liên quan.

Seed tài khoản admin:

```bash
npm run seed:users --prefix server
```

Chạy dev:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Lệnh chính

```bash
npm run dev              # Chạy frontend và backend
npm run dev:client       # Chạy riêng frontend
npm run dev:server       # Chạy riêng backend
npm run build            # Build frontend
npm run start            # Chạy backend production
npm run seed:users --prefix server
```

## Quy ước phát triển

- Không dùng shadcn/ui hoặc shadcn CLI.
- Tuân theo `DESIGN.MD` cho màu, typography, spacing và component style.
- Ưu tiên tái sử dụng primitive trong `client/src/components/ui`.
- Admin controls render điều kiện bằng `user?.role === "admin"`.
- Không reintroduce student login nếu chưa được yêu cầu rõ.
- Public pages phải dùng được khi chưa đăng nhập.

## Tài liệu

- [Tài liệu tổng hợp](docs/README.md)
- [Thiết lập dịch vụ](docs/setup-services.md)
- [Kế hoạch tích hợp trình đọc ebook online](docs/ebook-reader-plan.md)
- [Triển khai Linux](docs/DeployLinux.md)
- [Triển khai Docker và CI/CD](docs/CICD_Docker.md)
