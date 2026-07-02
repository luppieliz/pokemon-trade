import { NextResponse } from "next/server";
import { getSets } from "@/lib/justtcg";
import type { GameId } from "@/lib/types";

// Returns the list of sets for a game, to populate the set picker.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = (searchParams.get("game") as GameId) || "pokemon";
  if (game !== "pokemon" && game !== "pokemon-japan") {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }
  try {
    const sets = await getSets(game);
    return NextResponse.json({ sets });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 502 });
  }
}
