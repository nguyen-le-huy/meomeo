# Meomeo

Meomeo is a YouTube-based English learning platform focused on Shadowing, Dictation, bilingual subtitles, and reading materials.

The application is publicly accessible without user accounts. Admin is the only authenticated role, managing content via inline controls within the public UI.

## Features

- **Public Library**: Curated YouTube videos and topics.
- **Admin Inline Management**: Manage topics, videos, and transcripts directly in the UI.
- **YouTube Integration**: Fetch metadata and transcripts using `yt-dlp`.
- **Transcript Tools**: Save, edit, and segment transcripts.
- **Dictation & Shadowing**: Practice dictation and record audio for pronunciation assessment (Azure Speech).
- **Bilingual Watch**: Dual subtitles for better comprehension.
- **Reading Practice**: Dictionary lookups and an upcoming EPUB/PDF ebook reader (with themes, fonts, and local progress tracking).

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, TanStack Query, React Router DOM.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT.
- **Services**: Cloudinary, Azure Speech SDK, OpenAI, ElevenLabs, Cloudflare R2, `yt-dlp-exec`.

## Folder Structure

```txt
.
├── client/                 # React frontend
├── server/                 # Express backend
├── docs/                   # Documentation & feature plans
├── docker-compose.yml
└── package.json            # Monorepo scripts
```

## Setup & Running Locally

**Prerequisites:** Node.js, MongoDB, `yt-dlp`.
Optional: Cloudinary, Azure Speech, OpenAI, ElevenLabs, Cloudflare R2.

1. **Install dependencies:**
   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. **Environment Variables:**
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```
   *Update the `.env` files with your keys (MongoDB, Azure, Cloudinary, etc).*

3. **Seed Admin Account:**
   ```bash
   npm run seed:users --prefix server
   ```

4. **Run Development Servers:**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000/api`

## Development Guidelines

- **No shadcn/ui:** Follow `DESIGN.MD` and build reusable UI primitives in `client/src/components/ui`.
- **Public First:** All learning features must work without logging in.
- **Inline Admin:** Render admin tools conditionally based on `user?.role === "admin"`.

## Documentation

See the [`docs/`](docs/) directory for detailed setup guides, deployment instructions, and feature plans (e.g., [Ebook Reader Plan](docs/ebook-reader-plan.md)).
