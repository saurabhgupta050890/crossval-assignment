import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/auth/signout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
