# AGENTS.md

## 1. Project Overview

This project is a TOEIC English learning web app for a teacher and student.

The app focuses on:

* Vocabulary courses
* Grammar courses
* Shadowing and dictation from YouTube videos
* Student learning progress tracking
* AI pronunciation scoring

The admin role is the teacher. The student role is the learner.

The project uses MERN Stack and should be built as a monorepo.

## 2. Tech Stack

### Frontend

Use:

* React
* Vite
* Tailwind CSS
* React Router DOM
* TanStack Query
* Zustand
* React Hook Form
* Zod
* Axios

### Backend

Use:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Multer
* Zod

### External Services

Use:

* MongoDB Atlas for database
* Cloudinary for images and audio files
* Azure AI Speech for pronunciation assessment
* OpenAI Text-to-Speech API for generating vocabulary and sentence audio

## 3. Project Structure

The project should follow this structure:

```txt
meomeo/
├── client/
├── server/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

Frontend structure:

```txt
client/
└── src/
    ├── app/
    │   ├── App.jsx
    │   ├── router.jsx
    │   └── providers.jsx
    │
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   └── learning/
    │
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── vocabulary/
    │   ├── grammar/
    │   ├── exercises/
    │   ├── speech/
    │   └── admin/
    │
    ├── services/
    ├── hooks/
    ├── utils/
    └── main.jsx
```

Backend structure:

```txt
server/
└── src/
    ├── config/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── courses/
    │   ├── vocabulary/
    │   ├── grammar/
    │   ├── exercises/
    │   ├── progress/
    │   ├── speech/
    │   └── media/
    │
    ├── middlewares/
    ├── utils/
    ├── routes/
    ├── app.js
    └── server.js
```

Each backend module should follow this pattern:

```txt
module-name/
├── module-name.model.js
├── module-name.routes.js
├── module-name.controller.js
├── module-name.service.js
└── module-name.validation.js
```

## 4. Backend Coding Rules

Follow these backend rules strictly:

1. Routes only define endpoints and attach middlewares.
2. Controllers only handle request and response.
3. Services contain business logic.
4. Models define Mongoose schemas.
5. Validation files define Zod schemas.
6. Do not put complex logic inside controllers.
7. Do not access MongoDB directly from controllers.
8. Always validate request body, params, and query when needed.
9. Use async error handling consistently.
10. Return consistent API response format.

Preferred API response format:

```js
{
  success: true,
  message: "Action completed successfully",
  data: {}
}
```

Preferred error response format:

```js
{
  success: false,
  message: "Error message",
  errors: []
}
```

## 5. Frontend Coding Rules

Follow these frontend rules strictly:

1. Organize code by feature.
2. Put shared UI components in `components/common`.
3. Put layout components in `components/layout`.
4. Put API functions in `services`.
5. Put reusable hooks in `hooks`.
6. Use TanStack Query for server state.
7. Use Zustand only for client/global UI state.
8. Use React Hook Form and Zod for forms.
9. Avoid putting API calls directly inside components.
10. Keep components small and readable.

## 6. Main Database Models

Use these main models.

### User

```js
{
  name,
  email,
  passwordHash,
  role: "admin" | "student",
  isActive,
  createdAt
}
```

### Course

```js
{
  title,
  type: "vocabulary" | "grammar" | "shadowing" | "listening",
  description,
  order,
  isPublished
}
```

### Module

```js
{
  courseId,
  title,
  description,
  order,
  isPublished
}
```

### VocabularyItem

```js
{
  moduleId,
  word,
  phonetic,
  partOfSpeech,
  meaningVi,
  meaningEn,
  example,
  exampleMeaningVi,
  imageUrl,
  audioUrl,
  order,
  difficulty
}
```

### Exercise

Use one flexible Exercise model instead of many separate exercise models.

```js
{
  moduleId,
  lessonId,
  type,
  title,
  instructions,
  questions,
  order,
  passingScore,
  isPublished
}
```

Supported exercise types:

```txt
pronunciation
vocab-multiple-choice
vocab-choose-meaning
vocab-fill-blank
grammar-multiple-choice
```

### PronunciationAttempt

```js
{
  userId,
  vocabularyId,
  exerciseId,
  spokenText,
  audioUrl,
  pronunciationScore,
  accuracyScore,
  fluencyScore,
  completenessScore,
  passed,
  azureResult,
  createdAt
}
```

### GrammarLesson

```js
{
  moduleId,
  title,
  slug,
  contentHtml,
  contentJson,
  order,
  isPublished
}
```

### UserProgress

```js
{
  userId,
  courseId,
  moduleId,
  lessonId,
  status: "not-started" | "in-progress" | "completed",
  progressPercent,
  completedVocabularyIds,
  completedExerciseIds,
  lastAccessedAt,
  completedAt
}
```

### ExerciseAttempt

```js
{
  userId,
  exerciseId,
  answers,
  score,
  totalQuestions,
  correctCount,
  passed,
  startedAt,
  submittedAt
}
```

### GeneratedAudio

```js
{
  text,
  voice,
  provider: "openai" | "azure",
  audioUrl,
  type: "word" | "sentence" | "paragraph",
  relatedModel,
  relatedId,
  createdAt
}
```

## 7. Feature Priority

Build features in this order:

1. Project setup
2. Authentication
3. Admin course/module management
4. Vocabulary item CRUD
5. Student vocabulary learning page
6. Vocabulary exercises
7. Progress tracking
8. Grammar lesson CRUD
9. Grammar learning page
10. Pronunciation practice with Azure Speech
11. OpenAI TTS audio generation
12. Shadowing and dictation

Do not build advanced AI, payment, notification, or multi-teacher features before the MVP is stable.

## 8. MVP Scope

The MVP should support:

### Admin

* Login
* Create vocabulary course
* Create vocabulary modules
* Add vocabulary items
* Add vocabulary exercises
* Create grammar lessons
* View student progress

### Student

* Login
* View assigned courses
* Learn vocabulary
* Do vocabulary exercises
* Learn grammar lessons
* Track learning progress

## 9. Code Style

Use clear, simple, maintainable code.

Prefer:

* Small functions
* Explicit names
* Feature-based folders
* Reusable services
* Consistent validation
* Consistent error handling

Avoid:

* Large components
* Large controllers
* Mixed frontend/backend logic
* Hardcoded API URLs
* Repeated code
* Unvalidated input
* Business logic inside routes

## 10. Environment Variables

Use `.env` files. Never hardcode secrets.

Required backend environment variables:

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

OPENAI_API_KEY=
```

Required frontend environment variables:

```env
VITE_API_URL=http://localhost:5000/api
```

## 11. API Conventions

Use REST API.

Example routes:

```txt
POST   /api/auth/login
GET    /api/courses
POST   /api/courses
GET    /api/modules/:moduleId/vocabulary
POST   /api/vocabulary
PATCH  /api/vocabulary/:id
DELETE /api/vocabulary/:id

GET    /api/grammar-lessons
POST   /api/grammar-lessons
PATCH  /api/grammar-lessons/:id
DELETE /api/grammar-lessons/:id

POST   /api/exercises/:id/submit
GET    /api/progress/me
POST   /api/speech/pronunciation-assessment
POST   /api/media/upload
POST   /api/audio/generate
```

## 12. Instructions for Codex Agent

When implementing a feature:

1. Read this file first.
2. Check existing folder structure before creating new folders.
3. Follow the module structure.
4. Implement backend model, validation, service, controller, and route when needed.
5. Implement frontend service, hooks, and feature components when needed.
6. Keep code consistent with existing patterns.
7. Do not introduce new libraries unless necessary.
8. Do not change the architecture without explaining why.
9. Do not remove existing code unless required.
10. After coding, list what changed and what should be tested.

## 13. Current Assumption

The first major feature to implement is the vocabulary learning flow.

Start with:

1. Auth
2. Course and module setup
3. Vocabulary CRUD
4. Student vocabulary list page
5. Simple vocabulary exercise
6. Progress tracking

Pronunciation scoring and OpenAI TTS should be added after the basic vocabulary flow works.