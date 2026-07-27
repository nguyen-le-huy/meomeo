import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { config } from "../config/env.js";
import { getR2Client } from "../config/r2.js";

const allowedOrigins = [
  "https://meomeo.quest",
  "https://api.meomeo.quest",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const corsRules = [
  {
    AllowedOrigins: allowedOrigins,
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

const client = getR2Client();

await client.send(new PutBucketCorsCommand({
  Bucket: config.r2.bucketName,
  CORSConfiguration: {
    CORSRules: corsRules,
  },
}));

console.log(`Configured R2 CORS for bucket ${config.r2.bucketName}`);
console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
