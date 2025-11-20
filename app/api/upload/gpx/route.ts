import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { minioClient, getBucketName, ensureBucket } from "@/lib/minio";
import { randomUUID } from "crypto";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure bucket exists (will create if it doesn't)
    try {
      await ensureBucket();
    } catch (error) {
      console.error("Failed to ensure bucket exists:", error);
      // Continue anyway - MinIO might create it automatically
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".gpx") && file.type !== "application/gpx+xml") {
      return NextResponse.json(
        { error: "Invalid file type. Only GPX files are allowed." },
        { status: 400 }
      );
    }

    // Generate unique object name
    const fileExtension = path.extname(file.name);
    const objectName = `gpx/${session.user.id}/${randomUUID()}${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    await minioClient.putObject(
      getBucketName(),
      objectName,
      buffer,
      buffer.length,
      {
        "Content-Type": file.type || "application/gpx+xml",
        "Content-Disposition": `attachment; filename="${file.name}"`,
      }
    );

    return NextResponse.json({
      objectName,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading GPX file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

