import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listObjects } from "@/lib/gcs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";

  try {
    const items = await listObjects(prefix);
    return NextResponse.json(items);
  } catch (err) {
    console.error("browse error", err);
    return NextResponse.json({ error: "Failed to list objects" }, { status: 500 });
  }
}
