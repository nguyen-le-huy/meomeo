import {
  getReuploadCredentials,
  getUploadCredentials,
  markUploadCompleted,
  reportUploadProgress,
  syncStreamStatus,
} from "../services/movieApi.js";

const progressReportIntervalMs = 2000;
const minimumProgressBytes = 5 * 1024 * 1024;

function getUploadErrorMessage(error) {
  const status = error?.originalResponse?.getStatus?.();
  if (status === 423) {
    return "Một phiên upload khác vẫn đang chạy. Chờ khoảng một phút rồi chọn lại file để tiếp tục.";
  }
  const body = error?.originalResponse?.getBody?.();
  const detail = body || error?.message || "TUS upload failed";
  return status ? `${detail} (HTTP ${status})` : detail;
}

function getFileMetadata(file) {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileLastModified: file.lastModified || 0,
    fileType: file.type || "video/mp4",
  };
}

async function finishUpload(movieId, file) {
  await reportUploadProgress(movieId, {
    progress: 100,
    bytesUploaded: file.size,
    bytesTotal: file.size,
  }).catch(() => undefined);

  try {
    await markUploadCompleted(movieId);
    return;
  } catch {
    // Bunny is the source of truth once TUS has acknowledged the final byte.
    // A temporary app API failure must not make the user upload the movie again.
    await syncStreamStatus(movieId).catch(() => undefined);
  }
}

export async function uploadMovieFile({ credentials: suppliedCredentials, file, isReupload = false, movieId, onProgress, title }) {
  const tus = await import("tus-js-client");
  if (!tus.isSupported) {
    throw new Error("Trình duyệt này không hỗ trợ upload có thể tiếp tục. Hãy dùng phiên bản Chrome, Edge, Firefox hoặc Safari mới.");
  }

  const credentials = suppliedCredentials
    || (
      isReupload
        ? (await getReuploadCredentials(movieId, getFileMetadata(file))).data.data.upload
        : (await getUploadCredentials(movieId, getFileMetadata(file))).data.data.upload
    );
  let lastReportedAt = 0;
  let lastReportedBytes = 0;
  let latestProgress = 0;
  let latestUploaded = 0;

  function updateProgress(bytesUploaded, bytesTotal) {
    const progress = bytesTotal ? Math.min(100, Math.floor((bytesUploaded / bytesTotal) * 100)) : 0;
    latestProgress = progress;
    latestUploaded = bytesUploaded;
    onProgress?.(progress, bytesUploaded, bytesTotal);
    return progress;
  }

  function persistProgress(bytesUploaded, bytesTotal) {
    const progress = updateProgress(bytesUploaded, bytesTotal);
    if (bytesUploaded >= bytesTotal) return;
    const now = Date.now();
    if (
      (now - lastReportedAt < progressReportIntervalMs
        || bytesUploaded - lastReportedBytes < minimumProgressBytes)
    ) {
      return;
    }
    lastReportedAt = now;
    lastReportedBytes = bytesUploaded;
    void reportUploadProgress(movieId, { progress, bytesUploaded, bytesTotal }).catch(() => undefined);
  }

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: credentials.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      removeFingerprintOnSuccess: true,
      fingerprint: (selectedFile) => Promise.resolve(
        [
          "bunny-stream",
          credentials.libraryId,
          credentials.videoId,
          selectedFile.name,
          selectedFile.type,
          selectedFile.size,
          selectedFile.lastModified,
        ].join("-"),
      ),
      headers: {
        AuthorizationSignature: credentials.signature,
        AuthorizationExpire: String(credentials.expirationTime),
        VideoId: credentials.videoId,
        LibraryId: String(credentials.libraryId),
      },
      metadata: {
        filename: file.name,
        filetype: file.type || "video/mp4",
        title,
      },
      onProgress(bytesUploaded, bytesTotal) {
        persistProgress(bytesUploaded, bytesTotal);
      },
      async onSuccess() {
        updateProgress(file.size, file.size);
        await Promise.race([
          finishUpload(movieId, file),
          new Promise((done) => window.setTimeout(done, 3000)),
        ]);
        resolve();
      },
      onError(error) {
        const message = getUploadErrorMessage(error);
        void reportUploadProgress(movieId, {
          progress: latestProgress,
          bytesUploaded: latestUploaded,
          bytesTotal: file.size,
          error: message,
        }).catch(() => undefined);
        reject(new Error(message));
      },
    });

    upload.findPreviousUploads()
      .then((previousUploads) => {
        const latestUpload = previousUploads
          .slice()
          .sort((a, b) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())[0];
        if (latestUpload) upload.resumeFromPreviousUpload(latestUpload);
        upload.start();
      })
      .catch((error) => {
        const message = getUploadErrorMessage(error);
        reportUploadProgress(movieId, {
          progress: latestProgress,
          bytesUploaded: latestUploaded,
          bytesTotal: file.size,
          error: message,
        }).finally(() => reject(new Error(message)));
      });
  });
}
