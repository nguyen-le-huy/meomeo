# Meomeo

Meomeo is a comprehensive English learning platform that combines interactive YouTube video lessons, a Netflix-style movie player, daily vocabulary paths, and an Ebook reader. 

The application is publicly accessible without student user accounts. Admin is the only authenticated role, managing content via inline controls directly within the public UI.

## Features

- **YouTube Interactive Learning**: 
  - Bilingual subtitles for better comprehension.
  - **Dictation**: Practice listening and typing exactly what you hear.
  - **Shadowing**: Record your voice and get AI-powered pronunciation assessment via Azure Speech SDK.
  - Automated transcript fetching and segmentation via `yt-dlp`.
- **Netflix Chill (Movies)**: A custom video player for full movies, supporting dual subtitles and an immersive, cinematic UI.
- **Ebook Reader**: Read EPUB and PDF books with customizable themes, font scaling, and local reading progress tracking.
- **Vocabulary Daily Paths**: Curated vocabulary lessons broken down by day, utilizing interactive learning methods.
- **Integrated Dictionary**: Highlight words across videos, movies, and ebooks to instantly look them up, with a history of searched terms.
- **Admin Inline Management**: Add, edit, and curate topics, videos, transcripts, and ebooks directly in the UI.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, TanStack Query, React Router DOM, EPUB.js, PDF.js.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT.
- **Services/Integrations**: 
  - Azure Speech SDK (Pronunciation Assessment)
  - YouTube Iframe API & `yt-dlp-exec`
  - Cloudinary & Cloudflare R2 / BunnyCDN (Media Storage)
  - OpenAI / ElevenLabs (Optional AI integrations)

## Project Structure

This project operates as a monorepo containing both the frontend client and backend server.

### Root Directory

```txt
.
├── client/                 # React frontend application
├── server/                 # Express backend API
├── docs/                   # Documentation & feature plans
├── docker-compose.yml      # Docker services (MongoDB, etc.)
└── package.json            # Monorepo scripts (run dev, install, etc.)
```

### Frontend (`client/src/features`)

The frontend is structured into domain-driven feature modules:

- `auth/`: Admin login and authentication.
- `bilingual/`: Bilingual video watching UI.
- `dictionary/`: Dictionary popovers and search history.
- `ebooks/`: Ebook library and EPUB/PDF reader interface.
- `home/`: Public landing page.
- `movies/`: Netflix-style movie library and custom player.
- `topics/`: Categorization of YouTube lessons.
- `videos/`: Core YouTube player, transcript tools, dictation, and shadowing UI.
- `vocabulary/`: Daily vocabulary paths and lesson interactions.

### Backend (`server/src/modules`)

The backend is modularized to map to frontend features and core services:

- `auth/`, `users/`: Authentication and admin user management.
- `bilingual/`, `dictation/`, `shadowing/`: Video learning features.
- `topics/`, `videos/`: Library metadata and organization.
- `transcripts/`, `youtube/`: YouTube data extraction and segment processing.
- `speech/`: Azure Speech API integration.
- `dictionary/`, `vocabulary/`: Words and daily lessons API.
- `ebooks/`: Ebook metadata and file serving.
- `movies/`: Movie library management.
- `bunny/`, `media/`: Cloud storage and webhooks integration.
- `courses/`, `exercises/`, `grammar/`, `progress/`: Expanded learning modules.

## Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Required API keys (Azure Speech, Cloudinary, etc.)

### 2. Environment Variables
Create `.env` files in both the root directory (for the backend) and the `client` directory (for the frontend). Check the `.env.example` files for required keys.

### 3. Installation
Run the following from the root directory to install dependencies for both the frontend and backend:
```bash
npm install
```

### 4. Running the Development Servers
Start both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```
- The frontend runs on `http://localhost:5173`
- The backend runs on `http://localhost:5000`
