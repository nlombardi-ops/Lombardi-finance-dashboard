import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = process.env.DASHBOARD_PASSWORD;

  if (!correct || password !== correct) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = process.env.DASHBOARD_TOKEN;
  if (!token) {
    // Do NOT fall back to a random value here — a token that changes on
    // every login can never match AuthGuard's check, which is a silent,
    // permanent lockout. Fail loudly instead so the missing env var gets
    // noticed in dev.
    return NextResponse.json({ error: "DASHBOARD_TOKEN is not configured" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("dashboard_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("dashboard_auth");
  return response;
}
