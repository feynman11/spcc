import { Client } from "minio";

if (
  !process.env.MINIO_ENDPOINT ||
  !process.env.MINIO_ACCESS_KEY ||
  !process.env.MINIO_SECRET_KEY ||
  !process.env.MINIO_BUCKET_NAME
) {
  throw new Error(
    "Missing MinIO environment variables. Please check your .env file."
  );
}

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME;

// Ensure bucket exists
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
    console.log(`Created bucket: ${BUCKET_NAME}`);
  }
}

// Note: Bucket will be created automatically when first file is uploaded
// or you can call ensureBucket() manually during application startup

