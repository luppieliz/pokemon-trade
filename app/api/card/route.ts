import { NextResponse } from "next/server";
import { lookupCard } from "@/lib/justtcg";

// Look up a card within a set by name + number. Keeps the API key server-side.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("set") ?? "";
  const name = searchParams.get("name") ?? "";
  const number = searchParams.get("number") ?? "";
  const condition = searchParams.get("condition") ?? "";

  if (!setId) {
    return NextResponse.json({ error: "Pick a set first" }, { status: 400 });
  }
  if (!name.trim()) {
    return NextResponse.json({ error: "Card name is required" }, { status: 400 });
  }

  try {
    const card = await lookupCard({ setId, name, number, condition });
    if (!card) return NextResponse.json({ card: null }, { status: 404 });
    return NextResponse.json({ card });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lookup failed" }, { status: 502 });
  }
}
