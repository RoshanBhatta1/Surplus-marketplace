import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPresignedUpload, isStorageConfigured } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured on this deployment yet." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || (body.folder !== "listings" && body.folder !== "verification")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await createPresignedUpload({
      folder: body.folder,
      contentType: body.contentType,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create upload URL" },
      { status: 400 }
    );
  }
}
