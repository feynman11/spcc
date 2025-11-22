import { Client } from "minio";

// Lazy initialization - only create client when actually needed (at runtime)
let minioClientInstance: Client | null = null;
let connectionAttempted = false;

function createMinioClient(): Client {
  if (minioClientInstance) {
    return minioClientInstance;
  }

  // Log connection attempt
  if (!connectionAttempted) {
    console.log("[MinIO] Initializing MinIO client connection...");
    connectionAttempted = true;
  }

  // Check environment variables only when client is actually needed (runtime)
  const missingVars: string[] = [];
  if (!process.env.MINIO_ENDPOINT) missingVars.push("MINIO_ENDPOINT");
  if (!process.env.MINIO_ACCESS_KEY) missingVars.push("MINIO_ACCESS_KEY");
  if (!process.env.MINIO_SECRET_KEY) missingVars.push("MINIO_SECRET_KEY");
  if (!process.env.MINIO_BUCKET_NAME) missingVars.push("MINIO_BUCKET_NAME");

  if (missingVars.length > 0) {
    const errorMsg = `Missing MinIO environment variables: ${missingVars.join(", ")}. Please check your .env file.`;
    console.error("[MinIO] Configuration error:", errorMsg);
    throw new Error(errorMsg);
  }

  // At this point, we know these are defined due to the checks above
  const endpoint = process.env.MINIO_ENDPOINT!;
  const accessKey = process.env.MINIO_ACCESS_KEY!;
  const secretKey = process.env.MINIO_SECRET_KEY!;
  const port = parseInt(process.env.MINIO_PORT || "9000");
  const useSSL = process.env.MINIO_USE_SSL === "true";
  const bucketName = process.env.MINIO_BUCKET_NAME!;

  console.log("[MinIO] Creating client with configuration:", {
    endpoint,
    port,
    useSSL,
    bucketName,
    accessKey: "***configured***",
    secretKey: "***configured***",
  });

  try {
    minioClientInstance = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    console.log("[MinIO] Client created successfully");
    return minioClientInstance;
  } catch (error) {
    console.error("[MinIO] Failed to create client:", error);
    throw error;
  }
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
    const errorMsg = "Missing MINIO_BUCKET_NAME environment variable. Please check your .env file.";
    console.error("[MinIO] Configuration error:", errorMsg);
    throw new Error(errorMsg);
  }
  return process.env.MINIO_BUCKET_NAME;
}

// Ensure bucket exists
export async function ensureBucket() {
  const bucketName = getBucketName();
  console.log(`[MinIO] Checking if bucket '${bucketName}' exists...`);
  
  try {
    const exists = await minioClient.bucketExists(bucketName);
    
    if (exists) {
      console.log(`[MinIO] Bucket '${bucketName}' already exists`);
      return;
    }

    console.log(`[MinIO] Bucket '${bucketName}' does not exist, creating...`);
    await minioClient.makeBucket(bucketName, "us-east-1");
    console.log(`[MinIO] Successfully created bucket: ${bucketName}`);
  } catch (error) {
    console.error(`[MinIO] Error ensuring bucket '${bucketName}' exists:`, error);
    throw error;
  }
}

// Test MinIO connection
export async function testConnection(): Promise<boolean> {
  try {
    console.log("[MinIO] Testing connection...");
    const client = createMinioClient();
    const bucketName = getBucketName();
    
    // Try to list buckets as a connection test
    await client.listBuckets();
    console.log("[MinIO] Connection test successful");
    return true;
  } catch (error) {
    console.error("[MinIO] Connection test failed:", error);
    return false;
  }
}

// Note: Bucket will be created automatically when first file is uploaded
// or you can call ensureBucket() manually during application startup

