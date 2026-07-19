import * as tus from "tus-js-client";
import { getUploadCredentials, markUploadCompleted, reportUploadProgress } from "../services/movieApi.js";

const chunkSize = 20 * 1024 * 1024;

function getUploadErrorMessage(error) {
  const status = error?.originalResponse?.getStatus?.();
  if (status === 423) {
    return "Một phiên upload khác vẫn đang chạy. Chờ khoảng một phút rồi chọn lại file để tiếp tục.";
  }
  const body = error?.originalResponse?.getBody?.();
  const detail = body || error?.message || "TUS upload failed";
  return status ? `${detail} (HTTP ${status})` : detail;
}

export async function uploadMovieFile({ file, movieId, onProgress, title }) {
  const credentialsResponse = await getUploadCredentials(movieId);
  const credentials = credentialsResponse.data.data.upload;
  let lastReportedAt = 0;
  let latestProgress = 0;
  let latestUploaded = 0;

  async function persistProgress(bytesUploaded, bytesTotal, force = false, error = "") {
    const progress = bytesTotal ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
    latestProgress = progress;
    latestUploaded = bytesUploaded;
    onProgress?.(progress, bytesUploaded, bytesTotal);
    const now = Date.now();
    if (!force && progress < 100 && now - lastReportedAt < 1500) return;
    lastReportedAt = now;
    await reportUploadProgress(movieId, { progress, bytesUploaded, bytesTotal, ...(error ? { error } : {}) }).catch(() => undefined);
  }

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: credentials.endpoint,
      chunkSize,
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
      removeFingerprintOnSuccess: true,
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
        try {
          await persistProgress(file.size, file.size, true);
          await markUploadCompleted(movieId);
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      onError(error) {
        const message = getUploadErrorMessage(error);
        persistProgress(latestUploaded, file.size, true, message).finally(() => reject(new Error(message)));
      },
    });

    upload.findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
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
