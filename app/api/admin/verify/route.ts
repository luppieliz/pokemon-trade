import { NextResponse } from "next/server";

// Verifies the admin password (used by the /admin page to unlock the UI).
// Returns { ok: true } only when the password matches.
export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Admin password is not configured on the server." },
      { status: 500 }
    );
  }
  const provided = request.headers.get("x-admin-password") ?? "";
  return NextResponse.json({ ok: provided === expected });
}
