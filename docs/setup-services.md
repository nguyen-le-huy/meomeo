# Service Setup

## MongoDB Atlas Setup

1. Create a MongoDB Atlas project.
2. Create a cluster.
3. Create a database user with a strong password.
4. Add your local IP address to Network Access.
5. Copy the connection string from Atlas.
6. Create `server/.env` from `server/.env.example`.
7. Paste the connection string into `MONGO_URI`.

Example:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

## Cloudinary Setup

1. Create a Cloudinary account.
2. Open the Cloudinary Dashboard.
3. Copy these values:
   - Cloud name
   - API Key
   - API Secret
4. Paste them into `server/.env`.

Example:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Required Backend Env

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

OPENAI_API_KEY=
```

## Test MongoDB Connection

Run the backend:

```bash
cd server
npm run dev
```

Expected terminal output:

```txt
MongoDB Atlas connected: <host>
Server is running on port 5000
```

## Test Health Routes

```txt
GET http://localhost:5000/api/health
GET http://localhost:5000/api/media/health
```

## Test Upload

Use Postman or Thunder Client:

```txt
POST http://localhost:5000/api/media/upload
Body: form-data
Key: file
Value: selected image/audio/video file
```

Images are uploaded to:

```txt
meomeo-toeic/images
```

Audio files are uploaded to:

```txt
meomeo-toeic/audio
```

Videos are uploaded to:

```txt
meomeo-toeic/videos
```
