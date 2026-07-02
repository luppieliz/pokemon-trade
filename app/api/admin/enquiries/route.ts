import { NextResponse } from "next/server";
import { getEnquiries } from "@/lib/enquiries";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && request.headers.get("x-admin-password") === expected;
}

// Returns the enquiry log (buys + trades). Requires the admin password.
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const enquiries = await getEnquiries();
  return NextResponse.json({ enquiries });
}
