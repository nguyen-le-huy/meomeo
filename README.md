# Meomeo TOEIC Learning App

MERN monorepo for a TOEIC English learning app with separate React frontend and Express backend.

## Apps

- `client/`: React, Vite, Tailwind CSS
- `server/`: Node.js, Express, MongoDB, Mongoose

## Run Frontend

```bash
cd client
npm install
npm run dev
```

## Run Backend

```bash
cd server
npm install
npm run dev
```

## Run With Hot Reload

Install dependencies once:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Run frontend Vite HMR and backend nodemon together:

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:5173
```

Backend uses the `PORT` value from `server/.env`.

Backend health check:

```txt
GET http://localhost:5050/api/health
```

Service setup instructions:

```txt
docs/setup-services.md
```
