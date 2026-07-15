import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "./env.js";

function assertR2Config() {
  const missing = [];
  if (!config.r2.accountId) missing.push("R2_ACCOUNT_ID");
  if (!config.r2.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!config.r2.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!config.r2.bucketName) missing.push("R2_BUCKET_NAME");
  if (!config.r2.endpoint) missing.push("R2_ENDPOINT");
  if (missing.length) {
    throw new Error(`Missing Cloudflare R2 config: ${missing.join(", ")}`);
  }
}

export function getR2Client() {
  assertR2Config();
  return new S3Client({
    region: config.r2.region,
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });
}

export async function putR2Object({ key, body, contentType, contentLength }) {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: contentLength,
  }));
  return { bucket: config.r2.bucketName, key };
}

export async function deleteR2Object(key) {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: config.r2.bucketName, Key: key }));
}

export async function getR2ObjectStream(key, range) {
  const client = getR2Client();
  return client.send(new GetObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    ...(range ? { Range: range } : {}),
  }));
}
