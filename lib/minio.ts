import { Client } from "minio";

// Lazy initialization - only create client when actually needed (at runtime)
let minioClientInstance: Client | null = null;

function createMinioClient(): Client {
  if (minioClientInstance) {
    return minioClientInstance;
  }

  // Check environment variables only when client is actually needed (runtime)
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

  minioClientInstance = new Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });

  return minioClientInstance;
}

// For backward compatibility - use Proxy to defer initialization
export const minioClient = new Proxy({} as Client, {
  get(_target, prop) {
    const client = createMinioClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export function getBucketName(): string {
  if (!process.env.MINIO_BUCKET_NAME) {
    throw new Error(
      "Missing MINIO_BUCKET_NAME environment variable. Please check your .env file."
    );
  }
  return process.env.MINIO_BUCKET_NAME;
}

// Ensure bucket exists
export async function ensureBucket() {
  const bucketName = getBucketName();
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
    console.log(`Created bucket: ${bucketName}`);
  }
}

// Note: Bucket will be created automatically when first file is uploaded
// or you can call ensureBucket() manually during application startup

