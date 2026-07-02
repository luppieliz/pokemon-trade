import { NextResponse } from "next/server";
import { getListings, addListing, removeListing } from "@/lib/listings";
import type { CardInfo, Listing } from "@/lib/types";

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // must be configured
  return request.headers.get("x-admin-password") === expected;
}

// List current listings (public — same data the marketplace shows).
export async function GET() {
  const listings = await getListings();
  return NextResponse.json({ listings });
}

// Add a listing. Requires the admin password.
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const card: CardInfo = body?.card;
  if (!card?.id) {
    return NextResponse.json({ error: "Missing card" }, { status: 400 });
  }

  const listing: Listing = {
    ...card,
    listingId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    condition: body?.condition || "Near Mint",
    notes: body?.notes || "",
    listedAt: new Date().toISOString(),
  };

  try {
    const listings = await addListing(listing);
    return NextResponse.json({ ok: true, listings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save listing" },
      { status: 500 }
    );
  }
}

// Remove a listing by id. Requires the admin password.
export async function DELETE(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const listings = await removeListing(id);
    return NextResponse.json({ ok: true, listings });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to remove listing" },
      { status: 500 }
    );
  }
}
