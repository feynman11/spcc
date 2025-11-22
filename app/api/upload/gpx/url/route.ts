import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, getBucketName } from "@/lib/minio";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const objectName = searchParams.get("objectName");

    if (!objectName) {
      return NextResponse.json(
        { error: "objectName parameter is required" },
        { status: 400 }
      );
    }

    // Generate presigned URL (valid for 1 hour)
    const bucketName = getBucketName();
    console.log(`[MinIO] Generating presigned URL for object '${objectName}' in bucket '${bucketName}'`);
    
    let url: string;
    try {
      url = await minioClient.presignedGetObject(
        bucketName,
        objectName,
        3600 // 1 hour
      );
      console.log(`[MinIO] Successfully generated presigned URL for object '${objectName}'`);
    } catch (error) {
      console.error(`[MinIO] Failed to generate presigned URL for object '${objectName}' in bucket '${bucketName}':`, error);
      throw error;
    }

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[MinIO] Error generating presigned URL:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { error: error.message || "Failed to generate URL" },
      { status: 500 }
    );
  }
}

