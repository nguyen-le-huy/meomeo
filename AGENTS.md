# AGENTS.md

## Project Direction

This project is now a YouTube Shadowing and Dictation learning app.

Students do not need accounts or login. Admin is the only authenticated role and uses inline controls inside the public learning UI. Do not build a separate admin dashboard for the MVP.

## MVP Priorities

Build in this order:

1. Admin auth and seed account.
2. Public topic and video library.
3. Admin inline topic/video management.
4. YouTube metadata/transcript analysis with `yt-dlp` or `yt-dlp-exec`.
5. Transcript segment storage and editing.
6. Dictation Easy/Normal/Hard.
7. Browser audio recording.
8. Azure Speech Pronunciation Assessment for Shadowing.

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- shadcn/ui
- React Router DOM
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Axios

## Frontend UI Rule

Use shadcn/ui 100% for application UI from now on.

Requirements:

- New UI must be built from shadcn/ui components first: `Button`, `Input`, `Textarea`, `Select`, `Dialog`, `Sheet`, `Card`, `Tabs`, `Badge`, `Table`, `Form`, `DropdownMenu`, `Alert`, `Toast/Sonner`, and related primitives.
- Existing custom Tailwind-only UI should be migrated to shadcn/ui when touched.
- Do not create new ad hoc button/input/card/modal/table styles if a shadcn/ui component exists.
- Tailwind utility classes are allowed only for layout, spacing, responsive behavior, and small visual adjustments around shadcn/ui components.
- Shared shadcn/ui primitives should live in `client/src/components/ui`.
- Feature-specific compositions should live inside their feature folder and compose `components/ui` primitives.
- Use `lucide-react` icons inside shadcn/ui buttons/menus where icons are needed.
- Keep the matcha/coal theme through shadcn tokens in CSS variables and Tailwind theme, not scattered hardcoded colors.
- If a needed component is missing, add it with the shadcn CLI pattern before building the feature UI.

Backend:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Zod
- Multer
- yt-dlp / yt-dlp-exec
- Azure Speech SDK

## Backend Modules

Use module structure:

```txt
module-name/
├── module-name.model.js
├── module-name.routes.js
├── module-name.controller.js
├── module-name.service.js
└── module-name.validation.js
```

Core modules:

- `auth`
- `topics`
- `videos`
- `transcripts`
- `dictation`
- `shadowing`
- `youtube`
- `speech`

Controllers only handle request/response. Services contain business logic. Routes only define endpoints and middleware. Validate request bodies, params and query with Zod.

## Frontend Structure

Use feature folders:

- `auth`
- `topics`
- `videos`
- `dictation`
- `shadowing`
- `transcript`
- `admin-inline`

Public pages should be usable without login. Admin controls should render conditionally:

```js
const showAdminControls = user?.role === "admin";
```

Do not reintroduce student login unless explicitly requested.

## Main Models

Use these models for the new MVP:

- User: admin only.
- Topic.
- VideoLesson.
- TranscriptSegment.
- DictationAttempt with anonymous `sessionId`.
- ShadowingAttempt with anonymous `sessionId`.

## Environment

Backend required variables:

```env
PORT=5000
NODE_ENV=development
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
ADMIN_PASSWORD=1234567
```

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```
