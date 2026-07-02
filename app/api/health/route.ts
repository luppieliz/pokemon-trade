import { NextResponse } from "next/server";

// Diagnostic: reports which settings are present (booleans only — never the
// secret values). Safe to expose; useful for confirming deploy config.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    justtcg: !!process.env.JUSTTCG_API_KEY,
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    adminPassword: !!process.env.ADMIN_PASSWORD,
    buyMarkup: process.env.BUY_MARKUP ?? null,
    onVercel: process.env.VERCEL === "1",
  });
}
