import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSignedUrl } from "@/lib/gcs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const url = await getSignedUrl(key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("sign error", err);
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }
}
