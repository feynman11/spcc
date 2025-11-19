import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, BUCKET_NAME } from "@/lib/minio";

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
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      objectName,
      3600 // 1 hour
    );

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate URL" },
      { status: 500 }
    );
  }
}

